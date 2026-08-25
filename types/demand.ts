export const STATUS_LABELS: Record<string, string> = {
  NEW: 'Novas',
  AI_TRIAGE: 'IA organizando',
  BRIEFING_READY: 'Briefing pronto',
  WAITING_ASSIGNEE: 'Aguardando responsável',
  IN_PRODUCTION: 'Em produção',
  INTERNAL_REVIEW: 'Revisão interna',
  WAITING_APPROVAL: 'Aguardando aprovação',
  CHANGES_REQUESTED: 'Alteração solicitada',
  APPROVED: 'Aprovado',
  DELIVERED: 'Entregue',
  ARCHIVED: 'Arquivado',
};

export const KANBAN_STATUSES = [
  'NEW',
  'BRIEFING_READY',
  'WAITING_ASSIGNEE',
  'IN_PRODUCTION',
  'WAITING_APPROVAL',
  'CHANGES_REQUESTED',
  'DELIVERED',
] as const;
