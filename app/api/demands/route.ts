import { db } from '@/lib/db';
import { triageDemand } from '@/lib/agent';
import { createProtocol } from '@/lib/protocol';
import { NextResponse } from 'next/server';

export async function GET() {
  const demands = await db.demand.findMany({ include: { department: true, assignee: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(demands);
}

export async function POST(request: Request) {
  const body = await request.json();
  const triage = await triageDemand({ text: body.originalText });

  const demand = await db.demand.create({
    data: {
      protocol: createProtocol(),
      title: triage.title,
      originalText: body.originalText || null,
      briefing: triage.briefing,
      revisedText: triage.revisedText,
      missingInfo: triage.missingInfo,
      type: triage.type,
      priority: triage.priority,
      status: triage.missingInfo ? 'BRIEFING_READY' : 'WAITING_ASSIGNEE',
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      requesterName: body.requesterName || null,
      requesterPhone: body.requesterPhone || null,
      departmentId: body.departmentId || null,
      source: body.source || 'WEB',
      history: {
        create: { action: 'DEMAND_CREATED', toValue: 'Demanda registrada e triada' },
      },
    },
  });

  return NextResponse.json(demand, { status: 201 });
}
