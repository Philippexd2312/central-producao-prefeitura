# Arquitetura do fluxo

```text
WhatsApp oficial
      |
      v
Webhook Meta
      |
      v
Mensagens + imagens + áudio + documentos
      |
      v
Agente de triagem
  - transcreve áudio
  - interpreta imagem/documento
  - corrige texto
  - identifica secretaria
  - identifica tipo de produção
  - identifica prazo/prioridade
  - pergunta informação faltante
      |
      v
Demanda / Protocolo
      |
      v
Kanban de produção
      |
      +--> Design
      +--> Vídeo
      +--> Foto
      +--> Redação
      +--> Social Media
      |
      v
Revisão -> Aprovação -> Alteração -> Entrega
```

## Regra principal

O WhatsApp é o canal de entrada, mas o painel é a fonte oficial da produção.
Nada fica perdido na conversa: cada solicitação recebe protocolo, responsável,
histórico, materiais, prazo e status.
