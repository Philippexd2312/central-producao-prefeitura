# Central de Produção da Comunicação

MVP de gestão de demandas para Design, Vídeo, Fotografia, Redação e Social Media.

## O que já está nesta versão

- Painel Kanban com fluxo de produção.
- Cards com protocolo `COM-AAAA-00000`.
- Prioridade, tipo, secretaria, prazo e responsável.
- Cadastro manual de demanda.
- Triagem automática inicial do briefing.
- Histórico básico de mudança de status.
- Estrutura Prisma/PostgreSQL.
- Webhook base da WhatsApp Business Platform.
- Estrutura pronta para mensagens, anexos e IA.

## Rodar localmente

1. Copie `.env.example` para `.env`.
2. Inicie o PostgreSQL:

```bash
docker compose up -d
```

3. Instale dependências:

```bash
npm install
```

4. Gere o Prisma Client e crie o banco:

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

5. Inicie:

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Próxima etapa já planejada

1. Login e permissões por equipe.
2. Botão **Assumir demanda**.
3. Upload real de fotos, PDFs, vídeos e áudios.
4. Download automático da mídia recebida no WhatsApp.
5. Transcrição de áudio.
6. IA real para revisar texto, classificar demanda, detectar prazo e perguntar informação faltante.
7. Agrupar várias mensagens do mesmo solicitante em uma única demanda.
8. Enviar protocolo e atualizações pelo WhatsApp.
9. Aprovação / pedir alteração pelo WhatsApp.
10. Dashboard gerencial e relatórios por secretaria/equipe.

## WhatsApp

O endpoint de webhook é:

`/api/webhooks/whatsapp`

Variáveis previstas:

- `META_VERIFY_TOKEN`
- `META_ACCESS_TOKEN`
- `META_PHONE_NUMBER_ID`

A versão atual recebe o evento e cria demanda a partir de mensagens de texto/caption. O download de mídia e resposta automática entram na próxima etapa.
