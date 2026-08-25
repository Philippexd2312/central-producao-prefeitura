import { DemandStatus, UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const PRODUCTION_ROLES: UserRole[] = [
  UserRole.DESIGNER,
  UserRole.EDITOR,
  UserRole.COPYWRITER,
  UserRole.SOCIAL_MEDIA,
  UserRole.MANAGER,
  UserRole.ADMIN,
];

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const current = await db.demand.findUnique({
    where: { id },
    include: { assignee: true },
  });

  if (!current) {
    return NextResponse.json({ error: 'Demanda não encontrada' }, { status: 404 });
  }

  if (current.assigneeId) {
    return NextResponse.json(
      { error: `Esta demanda já foi assumida por ${current.assignee?.name ?? 'outro responsável'}.` },
      { status: 409 },
    );
  }

  if (current.status === DemandStatus.DELIVERED || current.status === DemandStatus.ARCHIVED) {
    return NextResponse.json({ error: 'Esta demanda já foi encerrada.' }, { status: 409 });
  }

  const user = await db.user.findFirst({
    where: {
      active: true,
      role: { in: PRODUCTION_ROLES },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Nenhum usuário de produção ativo foi encontrado.' },
      { status: 409 },
    );
  }

  const claimed = await db.$transaction(async tx => {
    const result = await tx.demand.updateMany({
      where: {
        id,
        assigneeId: null,
      },
      data: {
        assigneeId: user.id,
        status: DemandStatus.IN_PRODUCTION,
      },
    });

    if (result.count === 0) return null;

    await tx.demandHistory.create({
      data: {
        demandId: id,
        actorId: user.id,
        action: 'DEMAND_CLAIMED',
        fromValue: current.status,
        toValue: DemandStatus.IN_PRODUCTION,
      },
    });

    return tx.demand.findUnique({
      where: { id },
      include: { assignee: true, department: true },
    });
  });

  if (!claimed) {
    return NextResponse.json(
      { error: 'Outra pessoa assumiu esta demanda antes de você.' },
      { status: 409 },
    );
  }

  return NextResponse.json(claimed);
}
