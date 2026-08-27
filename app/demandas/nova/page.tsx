import NewDemandForm from '@/components/NewDemandForm';
import { db } from '@/lib/db';
import { getCurrentUser, isManagerRole } from '@/lib/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewDemandPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/login');
  if (!isManagerRole(current.role)) redirect('/meu-painel');

  const departments = await db.department.findMany({ where: { active: true }, orderBy: { code: 'asc' } });

  return (
    <div className="page formWrap">
      <div className="pageTitle">
        <div>
          <h1>Nova demanda</h1>
          <p>Cadastre manualmente ou use a IA para organizar o briefing. Os anexos entram junto nos dois modos.</p>
        </div>
      </div>
      <NewDemandForm departments={departments} />
    </div>
  );
}
