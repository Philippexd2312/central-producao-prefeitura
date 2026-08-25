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

## Variáveis para adicionar depois
- META_VERIFY_TOKEN
- META_ACCESS_TOKEN
- META_PHONE_NUMBER_ID
- OPENAI_API_KEY

Não coloque tokens reais no GitHub ou no arquivo `.env.example`.
