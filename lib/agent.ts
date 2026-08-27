import { DemandPriority, DemandType } from '@prisma/client';
import { db } from '@/lib/db';
import { getGeminiSettings, getOpenAISettings } from '@/lib/integrations';

type TriageInput = { text?: string | null; mediaTypes?: string[]; mediaContext?: string[] };

type GeminiInput =
  | { type: 'text'; text: string }
  | { type: 'image' | 'audio' | 'video' | 'document'; data: string; mime_type: string };

export type TriageResult = {
  title: string;
  briefing: string;
  revisedText: string;
  missingInfo: string | null;
  priority: DemandPriority;
  type: DemandType;
  departmentCode: string | null;
  dueAtIso: string | null;
};

const TRIAGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    briefing: { type: 'string' },
    revisedText: { type: 'string' },
    missingInfo: { type: ['string', 'null'] },
    priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
    type: { type: 'string', enum: ['DESIGN', 'VIDEO', 'PHOTO', 'COPY', 'SOCIAL', 'OTHER'] },
    departmentCode: { type: ['string', 'null'] },
    dueAtIso: { type: ['string', 'null'] },
  },
  required: ['title', 'briefing', 'revisedText', 'missingInfo', 'priority', 'type', 'departmentCode', 'dueAtIso'],
};

function detectType(text: string): DemandType {
  const normalized = text.toLowerCase();
  if (/vídeo|video|reels|filmagem|motion/.test(normalized)) return DemandType.VIDEO;
  if (/foto|fotografia|cobertura/.test(normalized)) return DemandType.PHOTO;
  if (/legenda|release|texto|comunicado|ofício|oficio/.test(normalized)) return DemandType.COPY;
  if (/publicar|instagram|facebook|social/.test(normalized)) return DemandType.SOCIAL;
  return DemandType.DESIGN;
}

function detectPriority(text: string): DemandPriority {
  const normalized = text.toLowerCase();
  if (/urgente|agora|pra hoje|para hoje|imediato/.test(normalized)) return DemandPriority.URGENT;
  if (/amanhã|amanha|alta prioridade/.test(normalized)) return DemandPriority.HIGH;
  return DemandPriority.NORMAL;
}

async function detectDepartment(text: string) {
  const departments = await db.department.findMany({ where: { active: true }, select: { code: true, name: true } }).catch(() => []);
  const normalized = text.toUpperCase();
  for (const department of departments) {
    if (normalized.includes(department.code.toUpperCase()) || normalized.includes(department.name.toUpperCase())) return department.code;
  }
  if (/SAÚDE|SAUDE|VACINA|UBS|HOSPITAL/.test(normalized)) return departments.find(d => d.code === 'SEMSA')?.code || null;
  if (/EDUCAÇÃO|EDUCACAO|ESCOLA|MATRÍCULA|MATRICULA/.test(normalized)) return departments.find(d => d.code === 'SEMED')?.code || null;
  if (/MEIO AMBIENTE|PESCA|AMBIENTAL/.test(normalized)) return departments.find(d => d.code === 'SEMMAS')?.code || null;
  return null;
}

function makeTitle(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return 'Nova demanda';
  return clean.length > 72 ? `${clean.slice(0, 69)}...` : clean;
}

function getOpenAIOutputText(data: any) {
  if (typeof data?.output_text === 'string') return data.output_text;
  const content = data?.output?.flatMap((item: any) => item?.content ?? []) ?? [];
  return content.find((item: any) => item?.type === 'output_text')?.text || '';
}

function getGeminiOutputText(data: any) {
  if (typeof data?.output_text === 'string') return data.output_text.trim();
  for (const step of data?.steps || []) {
    for (const block of step?.content || []) {
      if (block?.type === 'text' && typeof block.text === 'string') return block.text.trim();
    }
  }
  return '';
}

async function geminiInteraction(input: GeminiInput[], options?: { model?: string; schema?: any }) {
  const settings = await getGeminiSettings();
  if (!settings.apiKey) throw new Error('Chave do Gemini não configurada.');
  const body: any = {
    model: options?.model || settings.model,
    input,
  };
  if (options?.schema) {
    body.response_format = {
      type: 'text',
      mime_type: 'application/json',
      schema: options.schema,
    };
  }
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'x-goog-api-key': settings.apiKey,
      'Content-Type': 'application/json',
      'Api-Revision': '2026-05-20',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API ${response.status}: ${error.slice(0, 320)}`);
  }
  return response.json();
}

async function openAIResponse(body: any) {
  const settings = await getOpenAISettings();
  if (!settings.apiKey) throw new Error('Chave da OpenAI não configurada.');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Responses API ${response.status}: ${error.slice(0, 300)}`);
  }
  return response.json();
}

export async function transcribeAudio(bytes: Uint8Array, mimeType: string, filename = 'audio.ogg') {
  const gemini = await getGeminiSettings();
  if (gemini.apiKey) {
    try {
      const data = await geminiInteraction([
        { type: 'text', text: 'Transcreva este áudio em português do Brasil. Preserve nomes, datas, horários e números. Retorne somente a transcrição limpa, sem comentários.' },
        { type: 'audio', data: Buffer.from(bytes).toString('base64'), mime_type: mimeType },
      ], { model: gemini.transcribeModel });
      return getGeminiOutputText(data);
    } catch (error) {
      console.error('GEMINI_AUDIO_FALLBACK', error);
    }
  }

  const settings = await getOpenAISettings();
  if (!settings.apiKey) return '';
  const form = new FormData();
  form.append('model', settings.transcribeModel);
  form.append('language', 'pt');
  const audioBytes = new Uint8Array(bytes.byteLength);
  audioBytes.set(bytes);
  form.append('file', new Blob([audioBytes.buffer], { type: mimeType }), filename);
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: `Bearer ${settings.apiKey}` }, body: form,
  });
  if (!response.ok) return '';
  const data = await response.json();
  return String(data?.text || '').trim();
}

export async function describeImage(bytes: Uint8Array, mimeType: string, caption = '') {
  const prompt = [
    'Analise esta imagem como material recebido para uma equipe de comunicação de prefeitura.',
    'Extraia todo texto visível importante e descreva objetivamente o conteúdo.',
    'Identifique datas, horários, locais, nomes de eventos, secretarias e formatos pedidos quando houver.',
    caption ? `Legenda enviada pelo solicitante: ${caption}` : '',
    'Responda em português, de forma curta e factual.',
  ].filter(Boolean).join('\n');

  const gemini = await getGeminiSettings();
  if (gemini.apiKey) {
    try {
      const data = await geminiInteraction([
        { type: 'text', text: prompt },
        { type: 'image', data: Buffer.from(bytes).toString('base64'), mime_type: mimeType },
      ]);
      return getGeminiOutputText(data);
    } catch (error) {
      console.error('GEMINI_IMAGE_FALLBACK', error);
    }
  }

  const settings = await getOpenAISettings();
  if (!settings.apiKey) return '';
  const base64 = Buffer.from(bytes).toString('base64');
  const data = await openAIResponse({
    model: settings.model,
    input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }, { type: 'input_image', image_url: `data:${mimeType};base64,${base64}` }] }],
  });
  return getOpenAIOutputText(data).trim();
}

export async function readDocument(bytes: Uint8Array, mimeType: string, filename = 'documento.pdf') {
  const prompt = 'Leia este documento recebido pela comunicação da prefeitura. Extraia o pedido, texto principal, datas, horários, locais, secretaria, nomes e qualquer informação necessária para produzir a peça. Responda em português e de forma objetiva.';
  const gemini = await getGeminiSettings();
  if (gemini.apiKey) {
    try {
      const data = await geminiInteraction([
        { type: 'text', text: prompt },
        { type: 'document', data: Buffer.from(bytes).toString('base64'), mime_type: mimeType },
      ]);
      return getGeminiOutputText(data);
    } catch (error) {
      console.error('GEMINI_DOCUMENT_FALLBACK', error);
    }
  }

  const settings = await getOpenAISettings();
  if (!settings.apiKey) return '';
  const base64 = Buffer.from(bytes).toString('base64');
  const data = await openAIResponse({
    model: settings.model,
    input: [{ role: 'user', content: [
      { type: 'input_text', text: prompt },
      { type: 'input_file', filename, file_data: base64 },
    ] }],
  });
  return getOpenAIOutputText(data).trim();
}

function normalizeTriage(parsed: any): TriageResult {
  return {
    title: String(parsed.title || 'Nova demanda'),
    briefing: String(parsed.briefing || ''),
    revisedText: String(parsed.revisedText || ''),
    missingInfo: parsed.missingInfo ? String(parsed.missingInfo) : null,
    priority: parsed.priority as DemandPriority,
    type: parsed.type as DemandType,
    departmentCode: parsed.departmentCode ? String(parsed.departmentCode) : null,
    dueAtIso: parsed.dueAtIso ? String(parsed.dueAtIso) : null,
  };
}

async function geminiTriage(text: string): Promise<TriageResult> {
  const now = new Date().toISOString();
  const departments = await db.department.findMany({ where: { active: true }, select: { code: true, name: true }, orderBy: { code: 'asc' } });
  const departmentList = departments.map(d => `${d.code} = ${d.name}`).join('; ');
  const prompt = [
    'Você organiza demandas para a equipe de comunicação de uma prefeitura brasileira.',
    'Corrija ortografia sem inventar fatos. Preserve nomes próprios, datas, números e a intenção do solicitante.',
    'Gere um briefing claro para designer, editor de vídeo ou social media.',
    'Se informação realmente necessária estiver faltando, informe em missingInfo. Nunca invente data ausente.',
    `Data/hora de referência: ${now}`,
    `Secretarias válidas cadastradas: ${departmentList || 'nenhuma informada'}`,
    'Em departmentCode use somente uma sigla da lista acima quando houver evidência; caso contrário retorne null.',
    `Conteúdo recebido:\n${text}`,
  ].join('\n\n');
  const data = await geminiInteraction([{ type: 'text', text: prompt }], { schema: TRIAGE_SCHEMA });
  return normalizeTriage(JSON.parse(getGeminiOutputText(data)));
}

async function openAITriage(text: string): Promise<TriageResult> {
  const settings = await getOpenAISettings();
  const now = new Date().toISOString();
  const data = await openAIResponse({
    model: settings.model,
    input: [
      { role: 'developer', content: [{ type: 'input_text', text: 'Você organiza demandas para a equipe de comunicação de uma prefeitura brasileira. Corrija ortografia sem inventar fatos. Preserve nomes próprios, datas, números e intenções do solicitante. Classifique a demanda e gere um briefing claro. Nunca invente uma data ausente.' }] },
      { role: 'user', content: [{ type: 'input_text', text: `Data/hora de referência: ${now}\n\nConteúdo recebido:\n${text}` }] },
    ],
    text: { format: { type: 'json_schema', name: 'municipal_communication_demand', strict: true, schema: TRIAGE_SCHEMA } },
  });
  return normalizeTriage(JSON.parse(getOpenAIOutputText(data)));
}

async function fallbackTriage(text: string): Promise<TriageResult> {
  const missing: string[] = [];
  if (!/\b(hoje|amanhã|amanha|dia\s+\d|\d{1,2}\/\d{1,2}|prazo)\b/i.test(text)) missing.push('prazo/data de entrega');
  if (!/post|story|vídeo|video|reels|outdoor|banner|folder|arte|foto|comunicado/i.test(text)) missing.push('formato da peça');
  return {
    title: makeTitle(text),
    briefing: text || 'Demanda recebida sem texto. Verificar os materiais anexados.',
    revisedText: text,
    missingInfo: missing.length ? `Confirmar: ${missing.join(' e ')}.` : null,
    priority: detectPriority(text),
    type: detectType(text),
    departmentCode: await detectDepartment(text),
    dueAtIso: null,
  };
}

export async function triageDemand(input: TriageInput): Promise<TriageResult> {
  const parts = [input.text?.trim() || '', ...(input.mediaContext || []).filter(Boolean)];
  const text = parts.filter(Boolean).join('\n\n');
  if (!text) return fallbackTriage(text);

  const gemini = await getGeminiSettings();
  if (gemini.apiKey && gemini.enabled) {
    try { return await geminiTriage(text); } catch (error) { console.error('GEMINI_TRIAGE_FALLBACK', error); }
  }

  const openai = await getOpenAISettings();
  if (openai.apiKey && openai.enabled) {
    try { return await openAITriage(text); } catch (error) { console.error('OPENAI_TRIAGE_FALLBACK', error); }
  }

  return fallbackTriage(text);
}
