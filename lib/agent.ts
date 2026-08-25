import { DemandPriority, DemandType } from '@prisma/client';

type TriageInput = {
  text?: string | null;
  mediaTypes?: string[];
};

export type TriageResult = {
  title: string;
  briefing: string;
  revisedText: string;
  missingInfo: string | null;
  priority: DemandPriority;
  type: DemandType;
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

function makeTitle(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return 'Nova demanda';
  return clean.length > 72 ? `${clean.slice(0, 69)}...` : clean;
}

export async function triageDemand(input: TriageInput): Promise<TriageResult> {
  const text = (input.text ?? '').trim();

  // Primeira versão: triagem determinística para o sistema funcionar sem depender de API externa.
  // Depois, substituímos este bloco por um modelo de IA que interpreta texto, áudio transcrito e imagens.
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
  };
}
