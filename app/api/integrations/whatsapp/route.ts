import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptSecret, encryptSecret, getWhatsAppSettings } from '@/lib/integrations';
import { getCurrentUser, isManagerRole } from '@/lib/session';
import { testWhatsAppConnection } from '@/lib/meta';

async function managerOnly() {
  const user = await getCurrentUser();
  return user && isManagerRole(user.role) ? user : null;
}

export async function GET() {
  if (!await managerOnly()) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const saved = await db.integrationConfig.findUnique({ where: { provider: 'WHATSAPP' } });
  const settings = await getWhatsAppSettings();
  return NextResponse.json({
    enabled: settings.enabled,
    phoneNumberId: settings.phoneNumberId,
    businessAccountId: settings.businessAccountId,
    graphVersion: settings.graphVersion,
    verifyToken: saved?.verifyEncrypted ? decryptSecret(saved.verifyEncrypted) : (process.env.META_VERIFY_TOKEN || ''),
    hasAccessToken: Boolean(settings.accessToken),
    source: settings.source,
    aiReady: Boolean(process.env.OPENAI_API_KEY),
  });
}

export async function POST(request: Request) {
  if (!await managerOnly()) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const body = await request.json();

  if (body.action === 'test') {
    try {
      const result = await testWhatsAppConnection();
      return NextResponse.json({ ok: true, result });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Falha ao testar conexão.' }, { status: 400 });
    }
  }

  const current = await db.integrationConfig.findUnique({ where: { provider: 'WHATSAPP' } });
  const accessToken = String(body.accessToken || '').trim();
  const suppliedVerify = String(body.verifyToken || '').trim();
  const verifyToken = suppliedVerify || (current?.verifyEncrypted ? decryptSecret(current.verifyEncrypted) : crypto.randomBytes(18).toString('hex'));
  const phoneNumberId = String(body.phoneNumberId || '').trim();
  const businessAccountId = String(body.businessAccountId || '').trim();
  const graphVersion = String(body.graphVersion || 'v26.0').trim() || 'v26.0';

  if (!phoneNumberId) return NextResponse.json({ error: 'Informe o Phone Number ID.' }, { status: 400 });
  if (!accessToken && !current?.secretEncrypted && !process.env.META_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Informe o token de acesso da Meta.' }, { status: 400 });
  }

  const saved = await db.integrationConfig.upsert({
    where: { provider: 'WHATSAPP' },
    create: {
      provider: 'WHATSAPP',
      enabled: body.enabled !== false,
      phoneNumberId,
      businessAccountId: businessAccountId || null,
      graphVersion,
      secretEncrypted: accessToken ? encryptSecret(accessToken) : null,
      verifyEncrypted: encryptSecret(verifyToken),
    },
    update: {
      enabled: body.enabled !== false,
      phoneNumberId,
      businessAccountId: businessAccountId || null,
      graphVersion,
      secretEncrypted: accessToken ? encryptSecret(accessToken) : undefined,
      verifyEncrypted: encryptSecret(verifyToken),
    },
  });

  return NextResponse.json({
    ok: true,
    enabled: saved.enabled,
    phoneNumberId: saved.phoneNumberId,
    businessAccountId: saved.businessAccountId,
    graphVersion: saved.graphVersion,
    verifyToken,
    hasAccessToken: Boolean(saved.secretEncrypted || process.env.META_ACCESS_TOKEN),
  });
}
