import { redirect } from 'next/navigation';
import NewTeamMemberForm from '@/components/NewTeamMemberForm';
import { getCurrentUser, isManagerRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function NewTeamMemberPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/login');
  if (!isManagerRole(current.role)) redirect('/meu-painel');

  return (
    <div className="page formWrap">
      <div className="pageTitle">
        <div>
          <span className="eyebrow">EQUIPE DE PRODUÇÃO</span>
          <h1>Cadastrar profissional</h1>
          <p>Crie o acesso individual e defina o cargo da pessoa na Comunicação.</p>
        </div>
      </div>
      <div className="panel">
        <NewTeamMemberForm />
      </div>
    </div>
  );
}
