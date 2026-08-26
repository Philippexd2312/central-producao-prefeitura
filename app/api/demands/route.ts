import { AssetKind, DemandPriority, DemandType } from '@prisma/client';
import { db } from '@/lib/db';
import { triageDemand } from '@/lib/agent';
import { createProtocol } from '@/lib/protocol';
import { NextResponse } from 'next/server';

const MAX_FILE_DATA_URL_LENGTH = 6_500_000;
const MAX_ATTACHMENTS = 8;

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function assetKind(mimeType: string | null, name: string): AssetKind {
  const mime = (mimeType || '').toLowerCase();
  const lower = name.toLowerCase();

  if (mime.startsWith('image/')) return AssetKind.IMAGE;
  if (mime.startsWith('video/')) return AssetKind.VIDEO;
  if (mime.startsWith('audio/')) return AssetKind.AUDIO;
  if (mime.includes('pdf') || mime.includes('document') || mime.includes('sheet') || mime.includes('presentation')) return AssetKind.DOCUMENT;
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(lower)) return AssetKind.DOCUMENT;
  if (/\.(ai|psd|cdr|svg|eps)$/i.test(lower)) return AssetKind.REFERENCE;
  return AssetKind.OTHER;
}

function manualTitle(title: string, originalText: string) {
  if (title) return title.slice(0, 220);
  const firstLine = originalText.split(/\r?\n/).find(Boolean)?.trim() || 'Nova demanda';
  return firstLine.slice(0, 120);
}

export async function GET() {
  const demands = await db.demand.findMany({ include: { department: true, assignee: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(demands);
}

export async function POST(request: Request) {
  const body = await request.json();
  const mode = body.mode === 'manual' ? 'manual' : 'ai';
  const originalText = cleanText(body.originalText, 12_000);
  const typedTitle = cleanText(body.title, 220);

  if (!originalText && !typedTitle) {
    return NextResponse.json({ error: 'Informe o título ou a descrição da demanda.' }, { status: 400 });
  }

  const rawAttachments = Array.isArray(body.attachments) ? body.attachments.slice(0, MAX_ATTACHMENTS) : [];
  const attachments = rawAttachments
    .map((item: any) => ({
      name: cleanText(item?.name, 160),
      url: cleanText(item?.url, MAX_FILE_DATA_URL_LENGTH + 100),
      mimeType: cleanText(item?.mimeType, 100) || null,
    }))
    .filter((item: { name: string; url: string; mimeType: string | null }) => item.name && item.url);

  if (attachments.some((item: { url: string }) => item.url.length > MAX_FILE_DATA_URL_LENGTH)) {
    return NextResponse.json({ error: 'Um dos arquivos é muito grande. Use até 4 MB por arquivo.' }, { status: 413 });
  }

  const type = Object.values(DemandType).includes(body.type as DemandType) ? body.type as DemandType : DemandType.DESIGN;
  const priority = Object.values(DemandPriority).includes(body.priority as DemandPriority) ? body.priority as DemandPriority : DemandPriority.NORMAL;

  let title: string;
  let briefing: string | null;
  let revisedText: string | null;
  let missingInfo: string | null;
  let demandType: DemandType;
  let demandPriority: DemandPriority;
  let status: 'BRIEFING_READY' | 'WAITING_ASSIGNEE';

  if (mode === 'manual') {
    title = manualTitle(typedTitle, originalText);
    briefing = originalText || typedTitle;
    revisedText = originalText || null;
    missingInfo = null;
    demandType = type;
    demandPriority = priority;
    status = 'WAITING_ASSIGNEE';
  } else {
    const triage = await triageDemand({ text: [typedTitle, originalText].filter(Boolean).join('\n\n') });
    title = typedTitle || triage.title;
    briefing = triage.briefing;
    revisedText = triage.revisedText;
    missingInfo = triage.missingInfo;
    demandType = triage.type;
    demandPriority = triage.priority;
    status = triage.missingInfo ? 'BRIEFING_READY' : 'WAITING_ASSIGNEE';
  }

  const firstImage = attachments.find((item: { mimeType: string | null }) => item.mimeType?.startsWith('image/'));

  const demand = await db.demand.create({
    data: {
      protocol: createProtocol(),
      title,
      originalText: originalText || null,
      briefing,
      revisedText,
      missingInfo,
      type: demandType,
      priority: demandPriority,
      status,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      requesterName: cleanText(body.requesterName, 160) || null,
      requesterPhone: cleanText(body.requesterPhone, 80) || null,
      departmentId: body.departmentId || null,
      source: body.source || 'WEB',
      coverUrl: firstImage?.url || null,
      assets: attachments.length ? {
        create: attachments.map((item: { name: string; url: string; mimeType: string | null }) => ({
          name: item.name,
          url: item.url,
          mimeType: item.mimeType,
          kind: assetKind(item.mimeType, item.name),
        })),
      } : undefined,
      history: {
        create: {
          action: 'DEMAND_CREATED',
          toValue: mode === 'manual' ? 'Demanda registrada manualmente' : 'Demanda registrada e triada pela IA',
        },
      },
    },
    include: { assets: true },
  });

  return NextResponse.json(demand, { status: 201 });
}
