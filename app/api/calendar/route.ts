import { CalendarEventType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncEditorialCalendarBase } from '@/lib/calendar-base';
import { getCurrentUser, isManagerRole } from '@/lib/session';

async function requireManager() {
  const user = await getCurrentUser();
  return user && isManagerRole(user.role) ? user : null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  await syncEditorialCalendarBase();

  const events = await db.calendarEvent.findMany({
    where: { active: true },
    include: { department: { select: { id: true, code: true, name: true } } },
    orderBy: [{ eventDate: 'asc' }, { title: 'asc' }],
  });
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const actor = await requireManager();
  if (!actor) return NextResponse.json({ error: 'Somente a gestão pode alterar o calendário.' }, { status: 403 });

  const body = await request.json();
  if (body.action === 'seed_base' || body.action === 'sync_base') {
    const result = await syncEditorialCalendarBase();
    return NextResponse.json({ ok: true, ...result });
  }

  // Cadastro manual fica reservado a aniversários. As datas comemorativas
  // são mantidas automaticamente pelo calendário-base do sistema.
  const personName = String(body.personName || '').trim().slice(0, 160);
  const personRole = body.personRole ? String(body.personRole).trim().slice(0, 160) : null;
  const rawDate = String(body.eventDate || '');
  const parsedDate = rawDate ? new Date(`${rawDate}T12:00:00`) : null;

  if (!personName || !parsedDate || Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Informe o nome da pessoa e a data do aniversário.' }, { status: 400 });
  }

  const title = `Aniversário — ${personName}`;
  const leadDays = Math.max(0, Math.min(30, Number(body.leadDays ?? 3) || 3));
  const departmentId = body.departmentId ? String(body.departmentId) : null;

  const duplicate = await db.calendarEvent.findFirst({
    where: {
      type: CalendarEventType.BIRTHDAY,
      personName: { equals: personName, mode: 'insensitive' },
      active: true,
    },
  });

  if (duplicate) {
    return NextResponse.json({ error: 'Esse aniversário já está cadastrado.' }, { status: 409 });
  }

  const event = await db.calendarEvent.create({
    data: {
      title,
      description: body.description ? String(body.description).trim().slice(0, 2000) : null,
      type: CalendarEventType.BIRTHDAY,
      eventDate: parsedDate,
      annual: true,
      leadDays,
      personName,
      personRole,
      departmentId,
    },
    include: { department: { select: { id: true, code: true, name: true } } },
  });

  return NextResponse.json(event, { status: 201 });
}
