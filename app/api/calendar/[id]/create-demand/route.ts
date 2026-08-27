import { DemandPriority, DemandStatus, DemandType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { createProtocol } from '@/lib/protocol';
import { nextOccurrence, sourceForCalendarDemand } from '@/lib/editorial-calendar';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  const event = await db.calendarEvent.findUnique({ where: { id }, include: { department: true } });
  if (!event || !event.active) return NextResponse.json({ error: 'Data não encontrada.' }, { status: 404 });

  const occurrence = nextOccurrence(event);
  const source = sourceForCalendarDemand(event.id, occurrence);
  const existing = await db.demand.findFirst({ where: { source } });
  if (existing) return NextResponse.json({ ok: true, existing: true, id: existing.id });

  const birthdayText = event.type === 'BIRTHDAY'
    ? `Aniversário de ${event.personName || event.title}${event.personRole ? ` — ${event.personRole}` : ''}.`
    : '';
  const briefing = [
    `Produzir conteúdo para: ${event.title}.`,
    birthdayText,
    event.description || '',
    `Data: ${occurrence.toLocaleDateString('pt-BR')}.`,
    event.department ? `Secretaria: ${event.department.code} — ${event.department.name}.` : '',
  ].filter(Boolean).join('\n');

  const demand = await db.demand.create({
    data: {
      protocol: createProtocol(),
      title: event.type === 'BIRTHDAY' ? `Aniversário — ${event.personName || event.title}` : event.title,
      originalText: briefing,
      briefing,
      revisedText: briefing,
      type: DemandType.DESIGN,
      priority: DemandPriority.NORMAL,
      status: DemandStatus.WAITING_ASSIGNEE,
      dueAt: occurrence,
      departmentId: event.departmentId,
      requesterName: 'Calendário da Comunicação',
      source,
      history: {
        create: {
          actorId: actor.id,
          action: 'CALENDAR_DEMAND_CREATED',
          toValue: event.title,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, existing: false, id: demand.id }, { status: 201 });
}
