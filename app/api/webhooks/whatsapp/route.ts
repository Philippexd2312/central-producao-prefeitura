import { AssetKind, DemandStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { describeImage, readDocument, transcribeAudio, triageDemand } from '@/lib/agent';
import { downloadMetaMedia, sendWhatsAppText } from '@/lib/meta';
import { createProtocol } from '@/lib/protocol';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) return new Response(challenge || '', { status: 200 });
  return new Response('Forbidden', { status: 403 });
}

function assetKind(type: string): AssetKind {
  if (type === 'image') return AssetKind.IMAGE;
  if (type === 'audio') return AssetKind.AUDIO;
  if (type === 'video') return AssetKind.VIDEO;
  if (type === 'document') return AssetKind.DOCUMENT;
  return AssetKind.OTHER;
}

function extensionFromMime(mimeType: string) {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
    'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/aac': 'aac',
    'video/mp4': 'mp4', 'application/pdf': 'pdf',
  };
  return map[mimeType.split(';')[0]] || 'bin';
}

function safeDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function processMedia(message: any) {
  const mediaId = message?.image?.id || message?.audio?.id || message?.video?.id || message?.document?.id || null;
  if (!mediaId) return null;

  try {
    const downloaded = await downloadMetaMedia(mediaId);
    const filename = message?.document?.filename || `${message.type}-${mediaId}.${extensionFromMime(downloaded.mimeType)}`;
    let context = '';

    if (message.type === 'audio') {
      const transcript = await transcribeAudio(downloaded.bytes, downloaded.mimeType, filename);
      context = transcript ? `[Áudio transcrito]\n${transcript}` : '[Áudio recebido — transcrição pendente]';
    } else if (message.type === 'image') {
      const description = await describeImage(downloaded.bytes, downloaded.mimeType, message?.image?.caption || '');
      context = description ? `[Imagem analisada]\n${description}` : '[Imagem recebida — análise visual pendente]';
    } else if (message.type === 'document') {
      const description = downloaded.mimeType.includes('pdf')
        ? await readDocument(downloaded.bytes, downloaded.mimeType, filename)
        : '';
      context = description ? `[Documento analisado: ${filename}]\n${description}` : `[Documento recebido: ${filename}]`;
    } else if (message.type === 'video') {
      context = `[Vídeo recebido${message?.video?.caption ? `: ${message.video.caption}` : ''}]`;
    } else {
      context = `[Mídia recebida: ${message.type}]`;
    }

    return {
      mediaId,
      filename,
      mimeType: downloaded.mimeType,
      kind: assetKind(message.type),
      context,
    };
  } catch (error) {
    console.error('WHATSAPP_MEDIA_PROCESS_ERROR', mediaId, error);
    return {
      mediaId,
      filename: `${message.type}-${mediaId}`,
      mimeType: null,
      kind: assetKind(message.type),
      context: `[${message.type || 'Mídia'} recebida — processamento pendente]`,
    };
  }
}

export async function POST(request: Request) {
  const payload = await request.json();
  const changes = payload?.entry?.flatMap((entry: any) => entry.changes ?? []) ?? [];
  const events = changes.flatMap((change: any) => {
    const value = change?.value ?? {};
    return (value.messages ?? []).map((message: any) => ({
      message,
      contacts: value.contacts ?? [],
    }));
  });

  for (const event of events) {
    const message = event.message;
    if (!message?.id || !message?.from) continue;

    const text = message?.text?.body || message?.image?.caption || message?.video?.caption || message?.document?.caption || '';
    const mediaId = message?.image?.id || message?.audio?.id || message?.video?.id || message?.document?.id || null;
    const contact = event.contacts.find((item: any) => item?.wa_id === message.from) || event.contacts[0];
    const requesterName = contact?.profile?.name || null;

    const saved = await db.demandMessage.upsert({
      where: { externalId: message.id },
      update: {},
      create: {
        externalId: message.id,
        fromPhone: message.from,
        type: message.type || 'unknown',
        text: text || null,
        mediaId,
        rawJson: message,
      },
    });

    // Meta pode repetir webhooks. Se esta mensagem já foi ligada a uma demanda, não processa novamente.
    if (saved.demandId) continue;

    const media = mediaId ? await processMedia(message) : null;
    const newParts = [text, media?.context].filter(Boolean) as string[];
    if (!newParts.length) newParts.push(`[Mensagem do tipo ${message.type || 'desconhecido'} recebida]`);

    const groupWindowSeconds = Number(process.env.WHATSAPP_GROUP_WINDOW_SECONDS || 180);
    const since = new Date(Date.now() - Math.max(30, groupWindowSeconds) * 1000);

    const existing = await db.demand.findFirst({
      where: {
        requesterPhone: message.from,
        source: 'WHATSAPP',
        assigneeId: null,
        status: { in: [DemandStatus.NEW, DemandStatus.AI_TRIAGE, DemandStatus.BRIEFING_READY, DemandStatus.WAITING_ASSIGNEE] },
        updatedAt: { gte: since },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const combinedText = [existing?.originalText, ...newParts].filter(Boolean).join('\n\n');
    const triage = await triageDemand({ text: combinedText, mediaTypes: media ? [message.type] : [] });
    const department = triage.departmentCode
      ? await db.department.findUnique({ where: { code: triage.departmentCode } })
      : null;
    const dueAt = safeDate(triage.dueAtIso);

    let demand;
    let created = false;

    if (existing) {
      demand = await db.demand.update({
        where: { id: existing.id },
        data: {
          title: triage.title,
          originalText: combinedText,
          briefing: triage.briefing,
          revisedText: triage.revisedText,
          missingInfo: triage.missingInfo,
          type: triage.type,
          priority: triage.priority,
          status: DemandStatus.WAITING_ASSIGNEE,
          requesterName: requesterName || existing.requesterName,
          departmentId: department?.id ?? existing.departmentId,
          dueAt: dueAt ?? existing.dueAt,
          messages: { connect: { id: saved.id } },
          history: {
            create: {
              action: media ? 'WHATSAPP_MEDIA_ADDED' : 'WHATSAPP_MESSAGE_ADDED',
              toValue: message.id,
            },
          },
        },
      });
    } else {
      created = true;
      demand = await db.demand.create({
        data: {
          protocol: createProtocol(),
          title: triage.title,
          originalText: combinedText,
          briefing: triage.briefing,
          revisedText: triage.revisedText,
          missingInfo: triage.missingInfo,
          type: triage.type,
          priority: triage.priority,
          status: DemandStatus.WAITING_ASSIGNEE,
          requesterName,
          requesterPhone: message.from,
          source: 'WHATSAPP',
          departmentId: department?.id,
          dueAt,
          messages: { connect: { id: saved.id } },
          history: {
            create: [
              { action: 'WHATSAPP_RECEIVED', toValue: message.id },
              { action: 'AI_BRIEFING_READY', toValue: 'WAITING_ASSIGNEE' },
            ],
          },
        },
      });
    }

    await db.demandMessage.update({ where: { id: saved.id }, data: { demandId: demand.id } });

    if (media) {
      const mediaUrl = `/api/media/${media.mediaId}`;
      const alreadyAttached = await db.demandAsset.findFirst({
        where: { demandId: demand.id, url: mediaUrl },
      });
      if (!alreadyAttached) {
        await db.demandAsset.create({
          data: {
            demandId: demand.id,
            name: media.filename,
            url: mediaUrl,
            mimeType: media.mimeType,
            kind: media.kind,
          },
        });
      }
    }

    if (created) {
      const lines = [
        '✅ Demanda recebida e organizada pela IA.',
        `Protocolo: ${demand.protocol}`,
        `Tipo: ${triage.type}`,
        `Prioridade: ${triage.priority}`,
        'Já entrou na fila de produção da Comunicação.',
      ];
      if (triage.missingInfo) lines.push(`⚠️ ${triage.missingInfo}`);
      try {
        await sendWhatsAppText(message.from, lines.join('\n'));
      } catch (error) {
        console.error('WHATSAPP_ACK_ERROR', error);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
