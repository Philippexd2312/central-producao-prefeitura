import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encryptSecret, getGeminiSettings } from '@/lib/integrations';
import { getCurrentUser, isManagerRole } from '@/lib/session';

async function managerOnly() {
  const user = await getCurrentUser();
  return user && isManagerRole(user.role) ? user : null;
}

function extractOutputText(data: any) {
  if (typeof data?.output_text === 'string') return data.output_text.trim();
  for (const step of data?.steps || []) {
    for (const block of step?.content || []) {
      if (block?.type === 'text' && typeof block.text === 'string') return block.text.trim();
    }
  }
  return '';
}

async function testGemini(apiKey: string, model: string) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json',
      'Api-Revision': '2026-05-20',
    },
    body: JSON.stringify({
      model,
      input: [{ type: 'text', text: 'Responda somente: CONECTADO' }],
    }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini ${response.status}: ${error.slice(0, 260)}`);
  }
  const data = await response.json();
  return extractOutputText(data) || 'CONECTADO';
}

export async function GET() {
  if (!await managerOnly()) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const settings = await getGeminiSettings();
  return NextResponse.json({
    enabled: settings.enabled,
    hasApiKey: Boolean(settings.apiKey),
    model: settings.model,
    transcribeModel: settings.transcribeModel,
    source: settings.source,
  });
}

export async function POST(request: Request) {
  if (!await managerOnly()) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const body = await request.json();
  const current = await db.integrationConfig.findUnique({ where: { provider: 'GEMINI' } });
  const apiKey = String(body.apiKey || '').trim();
  const model = String(body.model || 'gemini-3.7-flash').trim() || 'gemini-3.7-flash';
  const transcribeModel = String(body.transcribeModel || model).trim() || model;
  const existingKey = current?.secretEncrypted || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey && !existingKey) return NextResponse.json({ error: 'Informe a chave da API Gemini.' }, { status: 400 });

  await db.integrationConfig.upsert({
    where: { provider: 'GEMINI' },
    create: {
      provider: 'GEMINI',
      enabled: body.enabled !== false,
      model,
      transcribeModel,
      secretEncrypted: apiKey ? encryptSecret(apiKey) : null,
    },
    update: {
      enabled: body.enabled !== false,
      model,
      transcribeModel,
      secretEncrypted: apiKey ? encryptSecret(apiKey) : undefined,
    },
  });

  const saved = await getGeminiSettings();
  if (body.action === 'test') {
    try {
      const result = await testGemini(saved.apiKey, saved.model);
      return NextResponse.json({ ok: true, enabled: true, hasApiKey: true, model: saved.model, transcribeModel: saved.transcribeModel, result });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao testar o Gemini.' }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, enabled: body.enabled !== false, hasApiKey: true, model, transcribeModel });
}
