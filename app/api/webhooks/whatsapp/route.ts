import { db } from '@/lib/db';
import { triageDemand } from '@/lib/agent';
import { createProtocol } from '@/lib/protocol';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) return new Response(challenge || '', { status: 200 });
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const changes = payload?.entry?.flatMap((entry: any) => entry.changes ?? []) ?? [];
  const messages = changes.flatMap((change: any) => change?.value?.messages ?? []);

  for (const message of messages) {
    const text = message?.text?.body || message?.image?.caption || message?.video?.caption || '';
    const mediaId = message?.image?.id || message?.audio?.id || message?.video?.id || message?.document?.id || null;

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

    // MVP: uma mensagem de texto inicia uma demanda. Na próxima etapa agrupamos mensagens
    // do mesmo número em uma janela de conversa e baixamos os anexos da API da Meta.
    if (text) {
      const triage = await triageDemand({ text });
      const demand = await db.demand.create({
        data: {
          protocol: createProtocol(),
          title: triage.title,
          originalText: text,
          briefing: triage.briefing,
          revisedText: triage.revisedText,
          missingInfo: triage.missingInfo,
          type: triage.type,
          priority: triage.priority,
          status: triage.missingInfo ? 'BRIEFING_READY' : 'WAITING_ASSIGNEE',
          requesterPhone: message.from,
          source: 'WHATSAPP',
          messages: { connect: { id: saved.id } },
          history: { create: { action: 'WHATSAPP_RECEIVED', toValue: message.id } },
        },
      });
      await db.demandMessage.update({ where: { id: saved.id }, data: { demandId: demand.id } });
    }
  }

  return NextResponse.json({ ok: true });
}
