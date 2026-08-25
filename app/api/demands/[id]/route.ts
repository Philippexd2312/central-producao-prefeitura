import { DemandPriority, DemandStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { authEnforced, getCurrentUser, isManagerRole } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demand = await db.demand.findUnique({ where: { id }, include: { department: true, assignee: true, assets: true, comments: true, history: true } });
  if (!demand) return NextResponse.json({ error: 'Demanda não encontrada' }, { status: 404 });
  return NextResponse.json(demand);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getCurrentUser();
  if (authEnforced() && !actor) {
    return NextResponse.json({ error: 'Entre no sistema para alterar a demanda.' }, { status: 401 });
  }

  const body = await request.json();
  const current = await db.demand.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: 'Demanda não encontrada' }, { status: 404 });

  const manager = actor ? isManagerRole(actor.role) : false;
  if (actor && !manager && current.assigneeId !== actor.id) {
    return NextResponse.json({ error: 'Você só pode alterar demandas atribuídas a você.' }, { status: 403 });
  }
  if (actor && !manager && body.assigneeId !== undefined) {
    return NextResponse.json({ error: 'Somente a gestão pode trocar o responsável.' }, { status: 403 });
  }

  const status = body.status && Object.values(DemandStatus).includes(body.status as DemandStatus)
    ? body.status as DemandStatus
    : undefined;
  const priority = body.priority && Object.values(DemandPriority).includes(body.priority as DemandPriority)
    ? body.priority as DemandPriority
    : undefined;

  const assigneeId = manager || !actor
    ? body.assigneeId === '' ? null : body.assigneeId ?? undefined
    : undefined;

  const demand = await db.demand.update({
    where: { id },
    data: {
      status,
      priority,
      assigneeId,
      dueAt: body.dueAt === '' ? null : body.dueAt ? new Date(body.dueAt) : undefined,
      history: status && status !== current.status ? {
        create: {
          actorId: actor?.id,
          action: 'STATUS_CHANGED',
          fromValue: current.status,
          toValue: status,
        },
      } : undefined,
    },
  });

  return NextResponse.json(demand);
}
