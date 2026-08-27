import { CalendarEventType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isManagerRole } from '@/lib/session';

const TYPES = new Set(Object.values(CalendarEventType));

const BASE_EVENTS = [
  ['Dia Internacional da Mulher', '03-08', 'COMMEMORATIVE'],
  ['Dia Internacional das Florestas', '03-21', 'COMMEMORATIVE'],
  ['Dia Mundial da Água', '03-22', 'COMMEMORATIVE'],
  ['Dia Mundial da Saúde', '04-07', 'COMMEMORATIVE'],
  ['Dia do Trabalho', '05-01', 'COMMEMORATIVE'],
  ['Dia Mundial do Meio Ambiente', '06-05', 'COMMEMORATIVE'],
  ['Dia do Estudante', '08-11', 'COMMEMORATIVE'],
  ['Dia do Folclore', '08-22', 'COMMEMORATIVE'],
  ['Independência do Brasil', '09-07', 'INSTITUTIONAL'],
  ['Dia da Árvore', '09-21', 'COMMEMORATIVE'],
  ['Dia das Crianças', '10-12', 'COMMEMORATIVE'],
  ['Dia do Professor', '10-15', 'COMMEMORATIVE'],
  ['Dia do Pintor', '10-18', 'COMMEMORATIVE'],
  ['Proclamação da República', '11-15', 'INSTITUTIONAL'],
  ['Dia da Consciência Negra', '11-20', 'COMMEMORATIVE'],
  ['Natal', '12-25', 'INSTITUTIONAL'],
] as const;

async function requireManager() {
  const user = await getCurrentUser();
  return user && isManagerRole(user.role) ? user : null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
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
  if (body.action === 'seed_base') {
    const currentYear = new Date().getFullYear();
    let created = 0;
    for (const [title, mmdd, rawType] of BASE_EVENTS) {
      const [month, day] = mmdd.split('-').map(Number);
      const existing = await db.calendarEvent.findFirst({ where: { title, annual: true } });
      if (existing) continue;
      await db.calendarEvent.create({
        data: {
          title,
          type: rawType as CalendarEventType,
          eventDate: new Date(currentYear, month - 1, day, 12, 0, 0, 0),
          annual: true,
          leadDays: 3,
          description: `Preparar conteúdo institucional para ${title}.`,
        },
      });
      created += 1;
    }
    return NextResponse.json({ ok: true, created });
  }

  const title = String(body.title || '').trim().slice(0, 180);
  const rawDate = String(body.eventDate || '');
  const parsedDate = rawDate ? new Date(`${rawDate}T12:00:00`) : null;
  if (!title || !parsedDate || Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Informe o nome e a data.' }, { status: 400 });
  }

  const type = TYPES.has(body.type as CalendarEventType) ? body.type as CalendarEventType : CalendarEventType.COMMEMORATIVE;
  const leadDays = Math.max(0, Math.min(30, Number(body.leadDays ?? 3) || 3));
  const departmentId = body.departmentId ? String(body.departmentId) : null;

  const event = await db.calendarEvent.create({
    data: {
      title,
      description: body.description ? String(body.description).trim().slice(0, 2000) : null,
      type,
      eventDate: parsedDate,
      annual: body.annual !== false,
      leadDays,
      personName: body.personName ? String(body.personName).trim().slice(0, 160) : null,
      personRole: body.personRole ? String(body.personRole).trim().slice(0, 160) : null,
      departmentId,
    },
    include: { department: { select: { id: true, code: true, name: true } } },
  });

  return NextResponse.json(event, { status: 201 });
}
