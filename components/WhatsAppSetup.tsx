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
  aiReady: boolean;
};

export default function WhatsAppSetup({ webhookUrl }: { webhookUrl: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [graphVersion, setGraphVersion] = useState('v26.0');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/integrations/whatsapp', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setPhoneNumberId(data.phoneNumberId || '');
        setBusinessAccountId(data.businessAccountId || '');
        setVerifyToken(data.verifyToken || '');
        setGraphVersion(data.graphVersion || 'v26.0');
      })
      .catch(() => setMessage('Não foi possível carregar a configuração.'));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setTestResult(null);
    const res = await fetch('/api/integrations/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, phoneNumberId, businessAccountId, verifyToken, graphVersion, enabled: true }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || 'Não foi possível salvar.');
      return;
    }
    setVerifyToken(data.verifyToken || verifyToken);
    setAccessToken('');
    setStatus(current => current ? { ...current, ...data, aiReady: current.aiReady } : data);
    setMessage('Configuração salva. Agora faça o teste da conexão.');
  }

  async function testConnection() {
    setTesting(true);
    setMessage('');
    const res = await fetch('/api/integrations/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test' }),
    });
    const data = await res.json();
    setTesting(false);
    if (!res.ok || !data.ok) {
      setTestResult(null);
      setMessage(data.error || 'Conexão não validada.');
      return;
    }
    setTestResult(data.result);
    setMessage('WhatsApp conectado com sucesso.');
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setMessage('Copiado.');
  }

  const connected = Boolean(testResult || (status?.enabled && status?.hasAccessToken && status?.phoneNumberId));

  return (
    <div className="waSetup">
      <section className="integrationHero">
        <div>
          <span className="sectionKicker">AUTOMAÇÃO DE ENTRADA</span>
          <h1>WhatsApp + IA</h1>
          <p>Conecte o número oficial da Comunicação. Texto, áudio, imagem e documento viram demanda automaticamente.</p>
        </div>
        <div className={`integrationStatus ${connected ? 'connected' : ''}`}>
          <span className="integrationStatusDot" />
          <div><strong>{connected ? 'WhatsApp configurado' : 'Aguardando conexão'}</strong><small>{status?.aiReady ? 'IA pronta para organizar demandas' : 'WhatsApp pronto; configure OPENAI_API_KEY para usar IA completa'}</small></div>
        </div>
      </section>

      <div className="integrationGrid">
        <section className="integrationCard">
          <div className="integrationCardHeader"><span className="integrationStep">1</span><div><h2>Dados da Meta</h2><p>Copie estes dados do painel WhatsApp da Meta.</p></div></div>
          <form onSubmit={save} className="integrationForm">
            <label>Token de acesso
              <input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder={status?.hasAccessToken ? 'Token já salvo — deixe vazio para manter' : 'Cole o token permanente'} autoComplete="new-password" />
            </label>
            <div className="integrationFormGrid">
              <label>Phone Number ID
                <input value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)} placeholder="Ex.: 1188293107710694" />
              </label>
              <label>WhatsApp Business Account ID
                <input value={businessAccountId} onChange={e => setBusinessAccountId(e.target.value)} placeholder="WABA ID" />
              </label>
            </div>
            <div className="integrationFormGrid">
              <label>Versão Graph
                <input value={graphVersion} onChange={e => setGraphVersion(e.target.value)} />
              </label>
              <label>Token de verificação
                <div className="copyField"><input value={verifyToken} onChange={e => setVerifyToken(e.target.value)} placeholder="Será gerado automaticamente" /><button type="button" onClick={() => copy(verifyToken)} disabled={!verifyToken}>Copiar</button></div>
              </label>
            </div>
            <button className="integrationPrimary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar configuração'}</button>
          </form>
        </section>

        <section className="integrationCard">
          <div className="integrationCardHeader"><span className="integrationStep">2</span><div><h2>Webhook</h2><p>Use estes dois valores na configuração do webhook da Meta.</p></div></div>
          <div className="webhookBox">
            <span>URL de retorno</span>
            <div className="copyField readonly"><input readOnly value={webhookUrl} /><button onClick={() => copy(webhookUrl)}>Copiar</button></div>
          </div>
          <div className="webhookBox">
            <span>Token de verificação</span>
            <div className="copyField readonly"><input readOnly value={verifyToken || 'Salve a configuração para gerar'} /><button onClick={() => copy(verifyToken)} disabled={!verifyToken}>Copiar</button></div>
          </div>
          <div className="webhookChecklist">
            <div><b>✓</b><span>Na Meta, assine o campo <strong>messages</strong>.</span></div>
            <div><b>✓</b><span>Use um número da WhatsApp Business Platform.</span></div>
            <div><b>✓</b><span>Depois clique em “Testar conexão” abaixo.</span></div>
          </div>
        </section>

        <section className="integrationCard testCard">
          <div className="integrationCardHeader"><span className="integrationStep">3</span><div><h2>Teste da conexão</h2><p>Confirma se token e número estão válidos na Meta.</p></div></div>
          <button className="integrationTestButton" onClick={testConnection} disabled={testing || !phoneNumberId}>{testing ? 'Testando...' : 'Testar conexão agora'}</button>
          {testResult && (
            <div className="connectionResult">
              <strong>Conectado</strong>
              <div><span>Número</span><b>{testResult.display_phone_number || '—'}</b></div>
              <div><span>Nome</span><b>{testResult.verified_name || '—'}</b></div>
              <div><span>Status</span><b>{testResult.status || '—'}</b></div>
              <div><span>Qualidade</span><b>{testResult.quality_rating || '—'}</b></div>
            </div>
          )}
        </section>

        <section className="integrationCard flowCard">
          <div className="integrationCardHeader"><span className="integrationStep">4</span><div><h2>O que acontece sozinho</h2><p>Depois de conectado, a entrada fica automática.</p></div></div>
          <div className="automationFlow">
            <div><span>1</span><b>WhatsApp</b><small>Texto, áudio, imagem ou arquivo</small></div>
            <i>→</i>
            <div><span>2</span><b>IA</b><small>Transcreve, lê e organiza</small></div>
            <i>→</i>
            <div><span>3</span><b>Produção</b><small>Cria o card e protocolo</small></div>
          </div>
        </section>
      </div>

      {message && <div className="integrationToast">{message}</div>}
    </div>
  );
}
