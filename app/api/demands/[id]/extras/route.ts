import { AssetKind } from '@prisma/client';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isManagerRole } from '@/lib/session';

const LABEL_COLORS = new Set(['green', 'gold', 'orange', 'red', 'purple', 'blue', 'teal', 'pink']);

async function canEditDemand(demandId: string, userId: string, manager: boolean) {
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

async function audit(demandId: string, actorId: string, action: string, toValue?: string | null) {
  await db.demandHistory.create({
    data: { demandId, actorId, action, toValue: toValue ?? null },
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const manager = isManagerRole(actor.role);
  if (!await canEditDemand(id, actor.id, manager)) {
    return NextResponse.json({ error: 'Você não pode alterar esta demanda.' }, { status: 403 });
  }

  const body = await request.json();
  const action = String(body.action || '');

  if (action === 'label:add') {
    const name = String(body.name || '').trim().slice(0, 40);
    const color = LABEL_COLORS.has(String(body.color)) ? String(body.color) : 'green';
    if (!name) return NextResponse.json({ error: 'Informe o nome da etiqueta.' }, { status: 400 });
    const label = await db.demandLabel.create({ data: { demandId: id, name, color } });
    await audit(id, actor.id, 'LABEL_ADDED', name);
    return NextResponse.json(label);
  }

  if (action === 'label:remove') {
    const labelId = String(body.labelId || '');
    const label = await db.demandLabel.findFirst({ where: { id: labelId, demandId: id } });
    if (!label) return NextResponse.json({ error: 'Etiqueta não encontrada.' }, { status: 404 });
    await db.demandLabel.delete({ where: { id: label.id } });
    await audit(id, actor.id, 'LABEL_REMOVED', label.name);
    return NextResponse.json({ ok: true });
  }

  if (action === 'checklist:add') {
    const text = String(body.text || '').trim().slice(0, 180);
    if (!text) return NextResponse.json({ error: 'Informe o item.' }, { status: 400 });
    const last = await db.demandChecklistItem.findFirst({ where: { demandId: id }, orderBy: { position: 'desc' } });
    const item = await db.demandChecklistItem.create({
      data: { demandId: id, text, position: (last?.position ?? -1) + 1 },
    });
    await audit(id, actor.id, 'CHECKLIST_ITEM_ADDED', text);
    return NextResponse.json(item);
  }

  if (action === 'checklist:toggle') {
    const itemId = String(body.itemId || '');
    const current = await db.demandChecklistItem.findFirst({ where: { id: itemId, demandId: id } });
    if (!current) return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 });
    const item = await db.demandChecklistItem.update({ where: { id: itemId }, data: { completed: !current.completed } });
    await audit(id, actor.id, item.completed ? 'CHECKLIST_ITEM_DONE' : 'CHECKLIST_ITEM_REOPENED', item.text);
    return NextResponse.json(item);
  }

  if (action === 'checklist:remove') {
    const itemId = String(body.itemId || '');
    const current = await db.demandChecklistItem.findFirst({ where: { id: itemId, demandId: id } });
    if (!current) return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 });
    await db.demandChecklistItem.delete({ where: { id: itemId } });
    await audit(id, actor.id, 'CHECKLIST_ITEM_REMOVED', current.text);
    return NextResponse.json({ ok: true });
  }

  if (action === 'member:add') {
    if (!manager) return NextResponse.json({ error: 'Somente a gestão pode adicionar membros.' }, { status: 403 });
    const userId = String(body.userId || '');
    const user = await db.user.findFirst({ where: { id: userId, active: true } });
    if (!user) return NextResponse.json({ error: 'Profissional não encontrado.' }, { status: 404 });
    await db.demandMember.upsert({
      where: { demandId_userId: { demandId: id, userId } },
      create: { demandId: id, userId },
      update: {},
    });
    await audit(id, actor.id, 'MEMBER_ADDED', user.name);
    return NextResponse.json({ id: user.id, name: user.name, role: user.role });
  }

  if (action === 'member:remove') {
    if (!manager) return NextResponse.json({ error: 'Somente a gestão pode remover membros.' }, { status: 403 });
    const userId = String(body.userId || '');
    const member = await db.demandMember.findUnique({ where: { demandId_userId: { demandId: id, userId } }, include: { user: true } });
    if (!member) return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 });
    await db.demandMember.delete({ where: { demandId_userId: { demandId: id, userId } } });
    await audit(id, actor.id, 'MEMBER_REMOVED', member.user.name);
    return NextResponse.json({ ok: true });
  }

  if (action === 'cover:set') {
    const url = String(body.url || '').trim();
    await db.demand.update({ where: { id }, data: { coverUrl: url || null } });
    await audit(id, actor.id, url ? 'COVER_SET' : 'COVER_REMOVED');
    return NextResponse.json({ coverUrl: url || null });
  }

  if (action === 'asset:add') {
    const name = String(body.name || '').trim().slice(0, 160);
    const url = String(body.url || '').trim();
    const mimeType = body.mimeType ? String(body.mimeType).slice(0, 100) : null;
    const rawKind = String(body.kind || 'REFERENCE');
    const kind = Object.values(AssetKind).includes(rawKind as AssetKind) ? rawKind as AssetKind : AssetKind.REFERENCE;
    if (!name || !url) return NextResponse.json({ error: 'Informe nome e arquivo/referência.' }, { status: 400 });
    if (url.length > 6_500_000) return NextResponse.json({ error: 'Arquivo muito grande. Use até 4 MB nesta versão.' }, { status: 413 });
    const asset = await db.demandAsset.create({ data: { demandId: id, name, url, mimeType, kind } });
    await audit(id, actor.id, 'ASSET_ADDED', name);
    return NextResponse.json(asset);
  }

  if (action === 'comment:add') {
    const text = String(body.text || '').trim().slice(0, 3000);
    if (!text) return NextResponse.json({ error: 'Escreva um comentário.' }, { status: 400 });
    const comment = await db.demandComment.create({
      data: { demandId: id, authorId: actor.id, text },
      include: { author: true },
    });
    return NextResponse.json(comment);
  }

  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
}
