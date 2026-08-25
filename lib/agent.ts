import { DemandPriority, DemandType } from '@prisma/client';

type TriageInput = {
  text?: string | null;
  mediaTypes?: string[];
  mediaContext?: string[];
};

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

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe';

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

function detectDepartment(text: string) {
  const normalized = text.toUpperCase();
  for (const code of ['SEMSA', 'SEMED', 'SEMMAS', 'SEMTURDE']) {
    if (normalized.includes(code)) return code;
  }
  if (/SAÚDE|SAUDE|VACINA|UBS|HOSPITAL/.test(normalized)) return 'SEMSA';
  if (/EDUCAÇÃO|EDUCACAO|ESCOLA|MATRÍCULA|MATRICULA/.test(normalized)) return 'SEMED';
  if (/MEIO AMBIENTE|PESCA|AMBIENTAL/.test(normalized)) return 'SEMMAS';
  if (/TURISMO|EVENTO TURÍSTICO|EVENTO TURISTICO/.test(normalized)) return 'SEMTURDE';
  return null;
}

function makeTitle(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return 'Nova demanda';
  return clean.length > 72 ? `${clean.slice(0, 69)}...` : clean;
}

function getOutputText(data: any) {
  if (typeof data?.output_text === 'string') return data.output_text;
  const content = data?.output?.flatMap((item: any) => item?.content ?? []) ?? [];
  return content.find((item: any) => item?.type === 'output_text')?.text || '';
}

async function openAIResponse(body: any) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada.');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Responses API ${response.status}: ${error.slice(0, 300)}`);
  }

  return response.json();
}

export async function transcribeAudio(bytes: Uint8Array, mimeType: string, filename = 'audio.ogg') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return '';

  const form = new FormData();
  form.append('model', TRANSCRIBE_MODEL);
  form.append('language', 'pt');

  // Copia os bytes para um ArrayBuffer próprio. Isso evita a incompatibilidade
  // SharedArrayBuffer x ArrayBuffer do Blob no build do Node/TypeScript.
  const audioBytes = new Uint8Array(bytes.byteLength);
  audioBytes.set(bytes);
  form.append('file', new Blob([audioBytes.buffer], { type: mimeType }), filename);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) throw new Error(`Falha ao transcrever áudio (${response.status}).`);
  const data = await response.json();
  return String(data?.text || '').trim();
}

export async function describeImage(bytes: Uint8Array, mimeType: string, caption = '') {
  if (!process.env.OPENAI_API_KEY) return '';
  const base64 = Buffer.from(bytes).toString('base64');
  const prompt = [
    'Analise esta imagem como material recebido para uma equipe de comunicação de prefeitura.',
    'Extraia todo texto visível que seja importante e descreva objetivamente o que a imagem contém.',
    'Identifique datas, horários, locais, nomes de eventos, secretarias e formatos pedidos quando houver.',
    caption ? `Legenda enviada pelo solicitante: ${caption}` : '',
    'Responda em português, de forma curta e factual.',
  ].filter(Boolean).join('\n');

  const data = await openAIResponse({
    model: OPENAI_MODEL,
    input: [{
      role: 'user',
      content: [
        { type: 'input_text', text: prompt },
        { type: 'input_image', image_url: `data:${mimeType};base64,${base64}` },
      ],
    }],
  });

  return getOutputText(data).trim();
}

export async function readDocument(bytes: Uint8Array, mimeType: string, filename = 'documento.pdf') {
  if (!process.env.OPENAI_API_KEY) return '';
  const base64 = Buffer.from(bytes).toString('base64');
  const data = await openAIResponse({
    model: OPENAI_MODEL,
    input: [{
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: 'Leia este documento recebido pela comunicação da prefeitura. Extraia o pedido, texto principal, datas, horários, locais, secretaria, nomes e qualquer informação necessária para produzir a peça. Responda em português e de forma objetiva.',
        },
        { type: 'input_file', filename, file_data: base64 },
      ],
    }],
  });
  return getOutputText(data).trim();
}

async function aiTriage(text: string): Promise<TriageResult> {
  const now = new Date().toISOString();
  const data = await openAIResponse({
    model: OPENAI_MODEL,
    input: [
      {
        role: 'developer',
        content: [{
          type: 'input_text',
          text: 'Você organiza demandas para a equipe de comunicação de uma prefeitura brasileira. Corrija ortografia sem inventar fatos. Preserve nomes próprios, datas, números e intenções do solicitante. Classifique a demanda e gere um briefing claro para designer, editor ou social media. Se algo importante realmente estiver faltando, informe em missingInfo. Datas relativas devem considerar o fuso do Brasil. Nunca invente uma data ausente.',
        }],
      },
      {
        role: 'user',
        content: [{
          type: 'input_text',
          text: `Data/hora de referência: ${now}\n\nConteúdo recebido:\n${text}`,
        }],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'municipal_communication_demand',
        strict: true,
        schema: {
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
        },
      },
    },
  });

  const parsed = JSON.parse(getOutputText(data));
  return {
    title: parsed.title,
    briefing: parsed.briefing,
    revisedText: parsed.revisedText,
    missingInfo: parsed.missingInfo,
    priority: parsed.priority as DemandPriority,
    type: parsed.type as DemandType,
    departmentCode: parsed.departmentCode,
    dueAtIso: parsed.dueAtIso,
  };
}

function fallbackTriage(text: string): TriageResult {
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
    departmentCode: detectDepartment(text),
    dueAtIso: null,
  };
}

export async function triageDemand(input: TriageInput): Promise<TriageResult> {
  const parts = [input.text?.trim() || '', ...(input.mediaContext || []).filter(Boolean)];
  const text = parts.filter(Boolean).join('\n\n');

  if (process.env.OPENAI_API_KEY && text) {
    try {
      return await aiTriage(text);
    } catch (error) {
      console.error('AI_TRIAGE_FALLBACK', error);
    }
  }

  return fallbackTriage(text);
}
