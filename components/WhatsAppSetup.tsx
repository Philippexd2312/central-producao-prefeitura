'use client';

import { FormEvent, useEffect, useState } from 'react';

type Status = {
  enabled: boolean;
  phoneNumberId: string;
  businessAccountId: string;
  graphVersion: string;
  verifyToken: string;
  hasAccessToken: boolean;
  source: string;
};

type AIStatus = {
  enabled: boolean;
  hasApiKey: boolean;
  model: string;
  transcribeModel: string;
  source: string;
};

export default function WhatsAppSetup({ webhookUrl }: { webhookUrl: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [graphVersion, setGraphVersion] = useState('v26.0');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3.7-flash');
  const [transcribeModel, setTranscribeModel] = useState('gemini-3.7-flash');
  const [saving, setSaving] = useState(false);
  const [savingAI, setSavingAI] = useState(false);
  const [testingAI, setTestingAI] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/integrations/whatsapp', { cache: 'no-store' }).then(res => res.json()),
      fetch('/api/integrations/gemini', { cache: 'no-store' }).then(res => res.json()),
    ]).then(([wa, ai]) => {
      setStatus(wa);
      setPhoneNumberId(wa.phoneNumberId || '');
      setBusinessAccountId(wa.businessAccountId || '');
      setVerifyToken(wa.verifyToken || '');
      setGraphVersion(wa.graphVersion || 'v26.0');
      setAIStatus(ai);
      setModel(ai.model || 'gemini-3.7-flash');
      setTranscribeModel(ai.transcribeModel || ai.model || 'gemini-3.7-flash');
    }).catch(() => setMessage('Não foi possível carregar a configuração.'));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setTestResult(null);
    const res = await fetch('/api/integrations/whatsapp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, phoneNumberId, businessAccountId, verifyToken, graphVersion, enabled: true }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMessage(data.error || 'Não foi possível salvar.'); return; }
    setVerifyToken(data.verifyToken || verifyToken);
    setAccessToken('');
    setStatus(current => current ? { ...current, ...data } : data);
    setMessage('Configuração do WhatsApp salva. Agora faça o teste da conexão.');
  }

  async function saveAI(event: FormEvent) {
    event.preventDefault();
    setSavingAI(true);
    setMessage('');
    const res = await fetch('/api/integrations/gemini', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, model, transcribeModel, enabled: true }),
    });
    const data = await res.json();
    setSavingAI(false);
    if (!res.ok) { setMessage(data.error || 'Não foi possível salvar o Gemini.'); return; }
    setApiKey('');
    setAIStatus(data);
    setMessage('Gemini configurado. Ele agora é a IA principal da automação.');
  }

  async function testAI() {
    setTestingAI(true);
    setMessage('');
    const res = await fetch('/api/integrations/gemini', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, model, transcribeModel, enabled: true, action: 'test' }),
    });
    const data = await res.json().catch(() => ({}));
    setTestingAI(false);
    if (!res.ok || !data.ok) { setMessage(data.error || 'Não foi possível validar o Gemini.'); return; }
    setApiKey('');
    setAIStatus(data);
    setMessage(`Gemini conectado com sucesso · ${data.model}.`);
  }

  async function testConnection() {
    setTesting(true);
    setMessage('');
    const res = await fetch('/api/integrations/whatsapp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'test' }),
    });
    const data = await res.json();
    setTesting(false);
    if (!res.ok || !data.ok) { setTestResult(null); setMessage(data.error || 'Conexão não validada.'); return; }
    setTestResult(data.result);
    setMessage('WhatsApp conectado com sucesso.');
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setMessage('Copiado.');
  }

  const connected = Boolean(testResult || (status?.enabled && status?.hasAccessToken && status?.phoneNumberId));
  const aiReady = Boolean(aiStatus?.enabled && aiStatus?.hasApiKey);

  return (
    <div className="waSetup">
      <section className="integrationHero">
        <div>
          <span className="sectionKicker">AUTOMAÇÃO DE ENTRADA</span>
          <h1>WhatsApp + Gemini</h1>
          <p>Texto, áudio, imagem e documento entram pelo WhatsApp, o Gemini organiza e a demanda nasce pronta para produção.</p>
        </div>
        <div className={`integrationStatus ${connected && aiReady ? 'connected' : ''}`}>
          <span className="integrationStatusDot" />
          <div><strong>{connected ? (aiReady ? 'Automação pronta' : 'WhatsApp conectado') : 'Aguardando conexão'}</strong><small>{aiReady ? `Gemini ativo · ${aiStatus?.model}` : 'Configure o Gemini para ativar a automação completa'}</small></div>
        </div>
      </section>

      <div className="integrationGrid">
        <section className="integrationCard">
          <div className="integrationCardHeader"><span className="integrationStep">1</span><div><h2>Dados da Meta</h2><p>Dados do número oficial na WhatsApp Business Platform.</p></div></div>
          <form onSubmit={save} className="integrationForm">
            <label>Token de acesso
              <input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder={status?.hasAccessToken ? 'Token já salvo — deixe vazio para manter' : 'Cole o token permanente'} autoComplete="new-password" />
            </label>
            <div className="integrationFormGrid">
              <label>Phone Number ID<input value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)} placeholder="ID do número" /></label>
              <label>WhatsApp Business Account ID<input value={businessAccountId} onChange={e => setBusinessAccountId(e.target.value)} placeholder="WABA ID" /></label>
            </div>
            <div className="integrationFormGrid">
              <label>Versão Graph<input value={graphVersion} onChange={e => setGraphVersion(e.target.value)} /></label>
              <label>Token de verificação<div className="copyField"><input value={verifyToken} onChange={e => setVerifyToken(e.target.value)} placeholder="Será gerado automaticamente" /><button type="button" onClick={() => copy(verifyToken)} disabled={!verifyToken}>Copiar</button></div></label>
            </div>
            <button className="integrationPrimary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar WhatsApp'}</button>
          </form>
        </section>

        <section className="integrationCard aiIntegrationCard geminiCard">
          <div className="geminiRibbon"><span>✦</span> IA PRINCIPAL</div>
          <div className="integrationCardHeader"><span className="integrationStep aiStep geminiStep">✦</span><div><h2>Gemini · Google AI</h2><p>Transcreve áudio, lê imagens/PDF e transforma mensagens em briefing.</p></div></div>
          <div className="geminiFreeNote"><strong>Nível gratuito disponível</strong><span>Ideal para começar; sujeito às cotas da API do Google.</span></div>
          <form onSubmit={saveAI} className="integrationForm">
            <label>Chave da API Gemini
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={aiStatus?.hasApiKey ? 'Chave já salva — deixe vazio para manter' : 'Cole a chave criada no Google AI Studio'} autoComplete="new-password" />
            </label>
            <div className="integrationFormGrid">
              <label>Modelo principal<input value={model} onChange={e => setModel(e.target.value)} /></label>
              <label>Áudio / transcrição<input value={transcribeModel} onChange={e => setTranscribeModel(e.target.value)} /></label>
            </div>
            <div className={`aiReadyBox ${aiReady ? 'ready' : ''}`}><span>✦</span><div><strong>{aiReady ? 'Gemini configurado' : 'Falta conectar o Gemini'}</strong><small>{aiReady ? 'Pronto para texto, áudio, imagem, documento e triagem automática.' : 'Crie a chave no Google AI Studio e cole acima.'}</small></div></div>
            <div className="geminiActions">
              <a className="geminiStudioLink" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Abrir Google AI Studio ↗</a>
              <button type="button" className="integrationTestButton geminiTest" onClick={testAI} disabled={testingAI}>{testingAI ? 'Testando...' : 'Testar Gemini'}</button>
              <button className="integrationPrimary aiSaveButton" disabled={savingAI}>{savingAI ? 'Salvando...' : 'Salvar Gemini'}</button>
            </div>
          </form>
        </section>

        <section className="integrationCard">
          <div className="integrationCardHeader"><span className="integrationStep">2</span><div><h2>Webhook</h2><p>Use estes dois valores na configuração do webhook da Meta.</p></div></div>
          <div className="webhookBox"><span>URL de retorno</span><div className="copyField readonly"><input readOnly value={webhookUrl} /><button onClick={() => copy(webhookUrl)}>Copiar</button></div></div>
          <div className="webhookBox"><span>Token de verificação</span><div className="copyField readonly"><input readOnly value={verifyToken || 'Salve a configuração para gerar'} /><button onClick={() => copy(verifyToken)} disabled={!verifyToken}>Copiar</button></div></div>
          <div className="webhookChecklist">
            <div><b>✓</b><span>Na Meta, assine o campo <strong>messages</strong>.</span></div>
            <div><b>✓</b><span>Use um número da WhatsApp Business Platform.</span></div>
            <div><b>✓</b><span>O Gemini processa o conteúdo antes de criar o card.</span></div>
          </div>
        </section>

        <section className="integrationCard testCard">
          <div className="integrationCardHeader"><span className="integrationStep">3</span><div><h2>Teste do WhatsApp</h2><p>Confirma se token e número estão válidos na Meta.</p></div></div>
          <button className="integrationTestButton" onClick={testConnection} disabled={testing || !phoneNumberId}>{testing ? 'Testando...' : 'Testar conexão agora'}</button>
          {testResult && <div className="connectionResult"><strong>Conectado</strong><div><span>Número</span><b>{testResult.display_phone_number || '—'}</b></div><div><span>Nome</span><b>{testResult.verified_name || '—'}</b></div><div><span>Status</span><b>{testResult.status || '—'}</b></div><div><span>Qualidade</span><b>{testResult.quality_rating || '—'}</b></div></div>}
        </section>

        <section className="integrationCard flowCard fullIntegrationCard">
          <div className="integrationCardHeader"><span className="integrationStep">4</span><div><h2>Fluxo automático</h2><p>Depois de conectado, a equipe recebe tudo organizado.</p></div></div>
          <div className="automationFlow">
            <div><span>1</span><b>WhatsApp</b><small>Texto, áudio, imagem ou arquivo</small></div><i>→</i>
            <div><span>2</span><b>Gemini</b><small>Transcreve, lê, identifica secretaria e organiza</small></div><i>→</i>
            <div><span>3</span><b>Produção</b><small>Cria card, protocolo, anexa material e responde o solicitante</small></div>
          </div>
        </section>
      </div>

      {message && <div className="integrationToast">{message}</div>}
    </div>
  );
}
