import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const current = await getCurrentUser();
  if (current) redirect('/meu-painel');
  const { erro } = await searchParams;

  const errorMessage = erro === 'credenciais'
    ? 'E-mail ou senha inválidos.'
    : erro === 'config'
      ? 'O acesso ainda não foi ativado pelo administrador.'
      : erro === 'campos'
        ? 'Preencha e-mail e senha.'
        : null;

  return (
    <div className="loginPage">
      <div className="loginCard">
        <div className="loginBrandMark">C</div>
        <span className="loginEyebrow">CENTRAL DE COMUNICAÇÃO</span>
        <h1>Entrar no painel</h1>
        <p>Use seu acesso individual para acompanhar suas demandas e assumir novos trabalhos.</p>

        {errorMessage && <div className="loginError">{errorMessage}</div>}

        <form action="/api/auth/login" method="post" className="loginForm">
          <label>
            <span>E-mail</span>
            <input name="email" type="email" autoComplete="email" required placeholder="voce@prefeitura.local" />
          </label>
          <label>
            <span>Senha</span>
            <input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
          </label>
          <button type="submit">Entrar</button>
        </form>

        <small>O administrador da Comunicação cria os acessos da equipe.</small>
      </div>
    </div>
  );
}
