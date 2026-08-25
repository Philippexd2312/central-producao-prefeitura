# Colocar online no Railway

## Estrutura
GitHub -> Railway App -> PostgreSQL Railway

## No GitHub
Crie um repositório privado chamado `central-producao-prefeitura` e envie o CONTEÚDO desta pasta para a raiz do repositório.
O arquivo `package.json` precisa aparecer na página principal do repositório.

## No Railway
1. New Project -> Deploy from GitHub repo -> selecione `central-producao-prefeitura`.
2. No mesmo projeto: + New -> Database -> PostgreSQL.
3. No serviço do aplicativo, abra Variables -> Add Reference Variable -> selecione `DATABASE_URL` do Postgres.
4. Em Settings -> Deploy -> Pre-deploy Command use: `npm run db:deploy`
5. Build Command: `npm run build` (Railway costuma detectar automaticamente).
6. Start Command: `npm start` (Railway costuma detectar automaticamente).
7. Em Settings -> Networking -> Public Networking -> Generate Domain.

## Login da equipe
Para criar o primeiro administrador, adicione estas variáveis no serviço do aplicativo:

- `AUTH_SECRET`: uma sequência longa e aleatória usada para assinar as sessões.
- `INITIAL_ADMIN_PASSWORD`: senha inicial do administrador. Use pelo menos 8 caracteres e não salve no GitHub.
- `INITIAL_ADMIN_EMAIL`: opcional. Padrão: `admin@prefeitura.local`.
- `INITIAL_ADMIN_NAME`: opcional. Padrão: `Administrador`.
- `AUTH_ENFORCE`: deixe `false` durante a configuração inicial. Depois de testar o login, altere para `true` para exigir autenticação em todo o sistema.

O comando de start executa o seed. Se `INITIAL_ADMIN_PASSWORD` estiver configurado e ainda não houver senha para o administrador, o acesso inicial será criado automaticamente.

Depois de entrar como administrador, use **Equipe -> Cadastrar profissional** para criar os acessos individuais.

## Variáveis para adicionar depois
- META_VERIFY_TOKEN
- META_ACCESS_TOKEN
- META_PHONE_NUMBER_ID
- OPENAI_API_KEY

Não coloque tokens ou senhas reais no GitHub ou no arquivo `.env.example`.
