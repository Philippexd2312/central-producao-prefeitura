import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isManagerRole } from '@/lib/session';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentUser();
  if (!actor || !isManagerRole(actor.role)) {
    return NextResponse.json({ error: 'Somente a gestão pode remover datas.' }, { status: 403 });
  }

  const { id } = await params;
  const event = await db.calendarEvent.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: 'Data não encontrada.' }, { status: 404 });
  await db.calendarEvent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
