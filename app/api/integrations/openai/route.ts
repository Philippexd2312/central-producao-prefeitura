import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encryptSecret, getOpenAISettings } from '@/lib/integrations';
import { getCurrentUser, isManagerRole } from '@/lib/session';

async function managerOnly() {
  const user = await getCurrentUser();
  return user && isManagerRole(user.role) ? user : null;
}

export async function GET() {
  if (!await managerOnly()) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const settings = await getOpenAISettings();
  return NextResponse.json({ enabled: settings.enabled, hasApiKey: Boolean(settings.apiKey), model: settings.model, transcribeModel: settings.transcribeModel, source: settings.source });
}

export async function POST(request: Request) {
  if (!await managerOnly()) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const body = await request.json();
  const current = await db.integrationConfig.findUnique({ where: { provider: 'OPENAI' } });
  const apiKey = String(body.apiKey || '').trim();
  const model = String(body.model || 'gpt-5.6-luna').trim() || 'gpt-5.6-luna';
  const transcribeModel = String(body.transcribeModel || 'gpt-4o-mini-transcribe').trim() || 'gpt-4o-mini-transcribe';

  if (!apiKey && !current?.secretEncrypted && !process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Informe a chave da OpenAI.' }, { status: 400 });

  await db.integrationConfig.upsert({
    where: { provider: 'OPENAI' },
    create: { provider: 'OPENAI', enabled: body.enabled !== false, model, transcribeModel, secretEncrypted: apiKey ? encryptSecret(apiKey) : null },
    update: { enabled: body.enabled !== false, model, transcribeModel, secretEncrypted: apiKey ? encryptSecret(apiKey) : undefined },
  });

  return NextResponse.json({ ok: true, enabled: body.enabled !== false, hasApiKey: true, model, transcribeModel });
}
