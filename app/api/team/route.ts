import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { getCurrentUser, isManagerRole } from '@/lib/session';

const ALLOWED_ROLES: UserRole[] = [
  UserRole.MANAGER,
  UserRole.DESIGNER,
  UserRole.EDITOR,
  UserRole.COPYWRITER,
  UserRole.SOCIAL_MEDIA,
];

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current || !isManagerRole(current.role)) {
    return NextResponse.json({ error: 'Sem permissão para cadastrar profissionais.' }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const role = body.role as UserRole;

  if (!name || !email || password.length < 8 || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Confira nome, e-mail, cargo e senha de pelo menos 8 caracteres.' }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Já existe um usuário com este e-mail.' }, { status: 409 });
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: hashPassword(password),
      active: true,
    },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  return NextResponse.json(user, { status: 201 });
}
