import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isManagerRole } from '@/lib/session';

function cleanCode(value: unknown) {
  return String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
}

function cleanName(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 180);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentUser();
  if (!actor || !isManagerRole(actor.role)) return NextResponse.json({ error: 'Somente a gestão pode alterar secretarias.' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const existing = await db.department.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Secretaria não encontrada.' }, { status: 404 });

  const code = body.code === undefined ? existing.code : cleanCode(body.code);
  const name = body.name === undefined ? existing.name : cleanName(body.name);
  const active = body.active === undefined ? existing.active : Boolean(body.active);
  if (!code || !name) return NextResponse.json({ error: 'Sigla e nome são obrigatórios.' }, { status: 400 });

  const conflict = await db.department.findFirst({ where: { id: { not: id }, OR: [{ code }, { name: { equals: name, mode: 'insensitive' } }] } });
  if (conflict) return NextResponse.json({ error: 'Já existe outra secretaria com essa sigla ou nome.' }, { status: 409 });

  const department = await db.department.update({ where: { id }, data: { code, name, active } });
  return NextResponse.json(department);
}
