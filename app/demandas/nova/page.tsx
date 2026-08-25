import NewDemandForm from '@/components/NewDemandForm';
import { db } from '@/lib/db';

export default async function NewDemandPage() {
  const departments = await db.department.findMany({ orderBy: { code: 'asc' } });
  return (
    <div className="page formWrap">
      <div className="pageTitle">
        <div>
          <h1>Nova demanda</h1>
          <p>O sistema organiza o pedido e transforma a mensagem em briefing.</p>
        </div>
      </div>
      <NewDemandForm departments={departments} />
    </div>
  );
}
