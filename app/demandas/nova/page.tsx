import NewDemandForm from '@/components/NewDemandForm';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function NewDemandPage() {
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
