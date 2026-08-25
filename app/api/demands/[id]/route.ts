import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demand = await db.demand.findUnique({ where: { id }, include: { department: true, assignee: true, assets: true, comments: true, history: true } });
  if (!demand) return NextResponse.json({ error: 'Demanda não encontrada' }, { status: 404 });
  return NextResponse.json(demand);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const current = await db.demand.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: 'Demanda não encontrada' }, { status: 404 });

  const demand = await db.demand.update({
    where: { id },
    data: {
      status: body.status ?? undefined,
      priority: body.priority ?? undefined,
      assigneeId: body.assigneeId === '' ? null : body.assigneeId ?? undefined,
      dueAt: body.dueAt === '' ? null : body.dueAt ? new Date(body.dueAt) : undefined,
      history: body.status && body.status !== current.status ? {
        create: { action: 'STATUS_CHANGED', fromValue: current.status, toValue: body.status },
      } : undefined,
    },
  });

  return NextResponse.json(demand);
}
