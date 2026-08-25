import { NextResponse } from 'next/server';
import { UserAvailability } from '@prisma/client';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export async function PATCH(request: Request) {
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await request.json();
  const availability = body.availability as UserAvailability;
  if (!Object.values(UserAvailability).includes(availability)) {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: current.id },
    data: { availability },
    select: { id: true, availability: true },
  });

  return NextResponse.json(user);
}
