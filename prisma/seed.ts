import { PrismaClient, DemandPriority, DemandStatus, DemandType, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const semsa = await prisma.department.upsert({ where: { code: 'SEMSA' }, update: {}, create: { code: 'SEMSA', name: 'Secretaria Municipal de Saúde' } });
  const semed = await prisma.department.upsert({ where: { code: 'SEMED' }, update: {}, create: { code: 'SEMED', name: 'Secretaria Municipal de Educação' } });
  const semmas = await prisma.department.upsert({ where: { code: 'SEMMAS' }, update: {}, create: { code: 'SEMMAS', name: 'Secretaria de Meio Ambiente e Mineração' } });
  const semturde = await prisma.department.upsert({ where: { code: 'SEMTURDE' }, update: {}, create: { code: 'SEMTURDE', name: 'Turismo e Desenvolvimento Econômico' } });

  const designer = await prisma.user.upsert({
    where: { email: 'designer@prefeitura.local' },
    update: {},
    create: { name: 'Designer 01', email: 'designer@prefeitura.local', role: UserRole.DESIGNER },
  });

  const demoCount = await prisma.demand.count();
  if (demoCount === 0) {
    await prisma.demand.createMany({
      data: [
        { protocol: 'COM-2026-00001', title: 'Campanha de vacinação — Post e Story', departmentId: semsa.id, type: DemandType.DESIGN, priority: DemandPriority.URGENT, status: DemandStatus.NEW, requesterName: 'Solicitante SEMSA', source: 'WHATSAPP', briefing: 'Criar post e story para campanha de vacinação.', originalText: 'Precisamos de uma arte da vacinação para sábado.' },
        { protocol: 'COM-2026-00002', title: 'Vídeo institucional — Acordo de Pesca', departmentId: semmas.id, type: DemandType.VIDEO, priority: DemandPriority.HIGH, status: DemandStatus.IN_PRODUCTION, assigneeId: designer.id, requesterName: 'Solicitante SEMMAS', source: 'WHATSAPP', briefing: 'Vídeo institucional curto sobre acordo de pesca.', originalText: 'Fazer vídeo do acordo de pesca.' },
        { protocol: 'COM-2026-00003', title: 'Comunicado de matrículas', departmentId: semed.id, type: DemandType.DESIGN, priority: DemandPriority.NORMAL, status: DemandStatus.WAITING_APPROVAL, requesterName: 'Solicitante SEMED', source: 'WEB', briefing: 'Comunicado institucional de matrículas.', originalText: 'Precisamos de comunicado das matrículas.' },
        { protocol: 'COM-2026-00004', title: 'Reels turismo — programação do fim de semana', departmentId: semturde.id, type: DemandType.VIDEO, priority: DemandPriority.NORMAL, status: DemandStatus.CHANGES_REQUESTED, requesterName: 'Solicitante SEMTURDE', source: 'WHATSAPP', briefing: 'Reels vertical com programação turística.', originalText: 'Fazer reels da programação.' }
      ]
    });
  }
}

main().finally(async () => prisma.$disconnect());
