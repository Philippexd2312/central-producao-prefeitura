import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PRODUCTION_ROLES = ['DESIGNER', 'EDITOR', 'COPYWRITER', 'SOCIAL_MEDIA', 'MANAGER', 'ADMIN'];

const ROLE_LABELS: Record<string, string> = {
  DESIGNER: 'Designer',
  EDITOR: 'Editor de vídeo',
  COPYWRITER: 'Redação',
  SOCIAL_MEDIA: 'Social media',
  MANAGER: 'Gestão',
  ADMIN: 'Administrador',
};

export default async function TeamPage() {
  const users = await db.user.findMany({
    where: { active: true, role: { in: PRODUCTION_ROLES as any } },
    include: {
      assignedDemands: {
        include: { department: true },
        orderBy: { updatedAt: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const totals = {
    people: users.length,
    production: users.reduce((sum, user) => sum + user.assignedDemands.filter(d => d.status === 'IN_PRODUCTION').length, 0),
    approval: users.reduce((sum, user) => sum + user.assignedDemands.filter(d => d.status === 'WAITING_APPROVAL').length, 0),
    late: users.reduce((sum, user) => sum + user.assignedDemands.filter(d => d.dueAt && d.dueAt < today && !['DELIVERED', 'ARCHIVED'].includes(d.status)).length, 0),
  };

  return (
    <div className="page teamPage">
      <div className="teamHero">
        <div>
          <span className="eyebrow">EQUIPE DE PRODUÇÃO</span>
          <h1>Painéis individuais</h1>
          <p>Cada profissional acompanha sua própria fila, prazos, aprovações e entregas.</p>
        </div>
        <div className="teamHeroBadge">
          <strong>{totals.people}</strong>
          <span>profissional(is) ativo(s)</span>
        </div>
      </div>

      <div className="teamStats">
        <div className="teamStat"><span className="teamStatIcon">◉</span><div><strong>{totals.people}</strong><span>na equipe</span></div></div>
        <div className="teamStat"><span className="teamStatIcon blue">▶</span><div><strong>{totals.production}</strong><span>em produção</span></div></div>
        <div className="teamStat"><span className="teamStatIcon gold">✓</span><div><strong>{totals.approval}</strong><span>em aprovação</span></div></div>
        <div className="teamStat"><span className="teamStatIcon red">!</span><div><strong>{totals.late}</strong><span>atrasadas</span></div></div>
      </div>

      <section className="teamSection">
        <div className="teamSectionHeader">
          <div>
            <span className="sectionKicker">PRODUÇÃO</span>
            <h2>Equipe</h2>
          </div>
          <span className="teamHint">Clique em um profissional para abrir o painel dele.</span>
        </div>

        {users.length === 0 ? (
          <div className="teamEmpty">Nenhum profissional de produção cadastrado ainda.</div>
        ) : (
          <div className="peopleGrid">
            {users.map(user => {
              const active = user.assignedDemands.filter(d => !['DELIVERED', 'ARCHIVED'].includes(d.status));
              const production = active.filter(d => d.status === 'IN_PRODUCTION').length;
              const approval = active.filter(d => d.status === 'WAITING_APPROVAL').length;
              const late = active.filter(d => d.dueAt && d.dueAt < today).length;
              const delivered30 = user.assignedDemands.filter(d => d.status === 'DELIVERED' && d.updatedAt >= monthAgo).length;

              return (
                <Link href={`/equipe/${user.id}`} className="personCard" key={user.id}>
                  <div className="personCardTop">
                    <div className="personAvatar">{user.name.charAt(0).toUpperCase()}</div>
                    <div className="personIdentity">
                      <strong>{user.name}</strong>
                      <span>{ROLE_LABELS[user.role] ?? user.role}</span>
                    </div>
                    <span className="personArrow">→</span>
                  </div>

                  <div className="personLoad">
                    <div><span>Fila ativa</span><strong>{active.length}</strong></div>
                    <div><span>Produção</span><strong>{production}</strong></div>
                    <div><span>Aprovação</span><strong>{approval}</strong></div>
                  </div>

                  <div className="personFooter">
                    <span className={late > 0 ? 'loadBadge late' : 'loadBadge'}>{late > 0 ? `${late} atrasada(s)` : 'Sem atrasos'}</span>
                    <span>{delivered30} entregue(s) / 30 dias</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
