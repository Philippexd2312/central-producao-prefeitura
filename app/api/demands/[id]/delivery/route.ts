import { AssetKind, DemandStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isManagerRole } from '@/lib/session';

async function canWorkOnDemand(demandId: string, userId: string, manager: boolean) {
  if (manager) return true;
  const demand = await db.demand.findUnique({
    where: { id: demandId },
    select: {
      assigneeId: true,
      members: { where: { userId }, select: { userId: true } },
    },
  });
  return Boolean(demand && (demand.assigneeId === userId || demand.members.length > 0));
}

function cleanText(value: unknown, max = 3000) {
  return String(value ?? '').trim().slice(0, max);
}

function cleanFile(body: any) {
  const name = cleanText(body?.name, 180);
  const url = cleanText(body?.url, 6_500_000);
  const mimeType = cleanText(body?.mimeType, 120) || null;
  if (!name || !url) return null;
  return { name, url, mimeType };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const manager = isManagerRole(actor.role);
  if (!await canWorkOnDemand(id, actor.id, manager)) {
    return NextResponse.json({ error: 'Você não pode alterar esta demanda.' }, { status: 403 });
  }

  const body = await request.json();
  const action = cleanText(body.action, 40);
  const demand = await db.demand.findUnique({
    where: { id },
    include: { versions: { orderBy: { number: 'desc' }, take: 1 } },
  });
  if (!demand) return NextResponse.json({ error: 'Demanda não encontrada.' }, { status: 404 });

  if (action === 'submit_version') {
    const file = cleanFile(body.file);
    if (!file) return NextResponse.json({ error: 'Anexe o arquivo que será enviado para aprovação.' }, { status: 400 });
    const nextNumber = (demand.versions[0]?.number ?? 0) + 1;
    const note = cleanText(body.note, 2000) || null;

    const version = await db.$transaction(async tx => {
      const created = await tx.demandVersion.create({
        data: {
          demandId: id,
          number: nextNumber,
          name: file.name,
          url: file.url,
          mimeType: file.mimeType,
          note,
          submittedById: actor.id,
        },
      });
      await tx.demandAsset.create({
        data: {
          demandId: id,
          name: `Versão ${nextNumber} — ${file.name}`,
          url: file.url,
          mimeType: file.mimeType,
          kind: AssetKind.PREVIEW,
        },
      });
      await tx.demand.update({
        where: { id },
        data: {
          status: DemandStatus.WAITING_APPROVAL,
          history: {
            create: {
              actorId: actor.id,
              action: 'VERSION_SUBMITTED',
              fromValue: demand.status,
              toValue: `V${nextNumber}`,
            },
          },
        },
      });
      return created;
    });

    return NextResponse.json({ ok: true, version, status: DemandStatus.WAITING_APPROVAL });
  }

  if (action === 'approve') {
    if (!manager) return NextResponse.json({ error: 'Somente a gestão pode aprovar.' }, { status: 403 });
    const latest = demand.versions[0];
    if (!latest) return NextResponse.json({ error: 'Essa demanda ainda não possui versão enviada.' }, { status: 400 });

    await db.demand.update({
      where: { id },
      data: {
        status: DemandStatus.APPROVED,
        approvedAt: new Date(),
        history: {
          create: {
            actorId: actor.id,
            action: 'VERSION_APPROVED',
            fromValue: demand.status,
            toValue: `V${latest.number}`,
          },
        },
      },
    });
    return NextResponse.json({ ok: true, status: DemandStatus.APPROVED });
  }

  if (action === 'request_changes') {
    if (!manager) return NextResponse.json({ error: 'Somente a gestão pode solicitar alteração.' }, { status: 403 });
    const note = cleanText(body.note, 3000);
    if (!note) return NextResponse.json({ error: 'Descreva o que precisa ser alterado.' }, { status: 400 });

    await db.$transaction([
      db.demand.update({
        where: { id },
        data: {
          status: DemandStatus.CHANGES_REQUESTED,
          history: {
            create: {
              actorId: actor.id,
              action: 'CHANGES_REQUESTED',
              fromValue: demand.status,
              toValue: note,
            },
          },
        },
      }),
      db.demandComment.create({ data: { demandId: id, authorId: actor.id, text: `Alteração solicitada: ${note}` } }),
    ]);
    return NextResponse.json({ ok: true, status: DemandStatus.CHANGES_REQUESTED });
  }

  if (action === 'deliver') {
    if (demand.status !== DemandStatus.APPROVED) {
      return NextResponse.json({ error: 'A demanda precisa estar aprovada antes da entrega.' }, { status: 400 });
    }

    const file = cleanFile(body.file);
    const latest = demand.versions[0];
    if (!file && !latest) return NextResponse.json({ error: 'Anexe o arquivo final para concluir a entrega.' }, { status: 400 });
    const note = cleanText(body.note, 3000) || null;

    await db.$transaction(async tx => {
      if (file) {
        const nextNumber = (latest?.number ?? 0) + 1;
        await tx.demandVersion.create({
          data: {
            demandId: id,
            number: nextNumber,
            name: file.name,
            url: file.url,
            mimeType: file.mimeType,
            note: note || 'Arquivo final entregue',
            final: true,
            submittedById: actor.id,
          },
        });
        await tx.demandAsset.create({
          data: { demandId: id, name: `FINAL — ${file.name}`, url: file.url, mimeType: file.mimeType, kind: AssetKind.FINAL },
        });
      } else if (latest) {
        await tx.demandVersion.update({ where: { id: latest.id }, data: { final: true } });
      }

      await tx.demand.update({
        where: { id },
        data: {
          status: DemandStatus.DELIVERED,
          deliveredAt: new Date(),
          deliveryNote: note,
          history: {
            create: {
              actorId: actor.id,
              action: 'DELIVERY_COMPLETED',
              fromValue: DemandStatus.APPROVED,
              toValue: note || 'Entrega final concluída',
            },
          },
        },
      });
    });

    return NextResponse.json({ ok: true, status: DemandStatus.DELIVERED });
  }

  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
}
