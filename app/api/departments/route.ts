import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isManagerRole } from '@/lib/session';

function cleanCode(value: unknown) {
  return String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
}

function cleanName(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 180);
}

async function requireManager() {
  const user = await getCurrentUser();
  return user && isManagerRole(user.role) ? user : null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  const departments = await db.department.findMany({
    include: { _count: { select: { demands: true, calendarEvents: true } } },
    orderBy: [{ active: 'desc' }, { code: 'asc' }],
  });
  return NextResponse.json(departments);
}

export async function POST(request: Request) {
  const actor = await requireManager();
  if (!actor) return NextResponse.json({ error: 'Somente a gestão pode cadastrar secretarias.' }, { status: 403 });

  const body = await request.json();

  if (body.action === 'bulk') {
    const lines = String(body.text || '').split(/\r?\n/).map((line: string) => line.trim()).filter(Boolean).slice(0, 80);
    const created = [];
    const skipped = [];
    for (const line of lines) {
      const parts = line.split(/\s*[—–-]\s*/, 2);
      const code = cleanCode(parts[0]);
      const name = cleanName(parts[1] || '');
      if (!code || !name) { skipped.push(line); continue; }
      const exists = await db.department.findFirst({ where: { OR: [{ code }, { name: { equals: name, mode: 'insensitive' } }] } });
      if (exists) { skipped.push(line); continue; }
      created.push(await db.department.create({ data: { code, name, active: true } }));
    }
    return NextResponse.json({ ok: true, created: created.length, skipped: skipped.length });
  }

  const code = cleanCode(body.code);
  const name = cleanName(body.name);
  if (!code || !name) return NextResponse.json({ error: 'Informe sigla e nome da secretaria.' }, { status: 400 });

  const exists = await db.department.findFirst({ where: { OR: [{ code }, { name: { equals: name, mode: 'insensitive' } }] } });
  if (exists) return NextResponse.json({ error: 'Já existe uma secretaria com essa sigla ou nome.' }, { status: 409 });

  const department = await db.department.create({ data: { code, name, active: true } });
  return NextResponse.json(department, { status: 201 });
}
