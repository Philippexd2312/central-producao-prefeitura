'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type DepartmentItem = {
  id: string;
  code: string;
  name: string;
  active: boolean;
  demandCount: number;
  calendarCount: number;
};

export default function DepartmentManager({ initialDepartments }: { initialDepartments: DepartmentItem[] }) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initialDepartments);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<DepartmentItem | null>(null);

  const activeCount = useMemo(() => departments.filter(item => item.active).length, [departments]);

  async function createOne(event: FormEvent) {
    event.preventDefault();
    if (!code.trim() || !name.trim() || saving) return;
    setSaving(true); setMessage('');
    const res = await fetch('/api/departments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, name }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMessage(data.error || 'Não foi possível cadastrar.');
    setCode(''); setName(''); setMessage('Secretaria cadastrada.');
    router.refresh();
  }

  async function createBulk() {
    if (!bulkText.trim() || saving) return;
    setSaving(true); setMessage('');
    const res = await fetch('/api/departments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'bulk', text: bulkText }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMessage(data.error || 'Não foi possível importar.');
    setBulkText('');
    setMessage(`${data.created || 0} secretaria(s) adicionada(s). ${data.skipped || 0} linha(s) ignorada(s).`);
    router.refresh();
  }

  async function saveEdit() {
    if (!editing || saving) return;
    setSaving(true); setMessage('');
    const res = await fetch(`/api/departments/${editing.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: editing.code, name: editing.name }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMessage(data.error || 'Não foi possível salvar.');
    setEditing(null); setMessage('Secretaria atualizada.'); router.refresh();
  }

  async function toggle(item: DepartmentItem) {
    const res = await fetch(`/api/departments/${item.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !item.active }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMessage(data.error || 'Não foi possível alterar.');
    setDepartments(current => current.map(dep => dep.id === item.id ? { ...dep, active: !item.active } : dep));
    setMessage(item.active ? 'Secretaria desativada. O histórico foi mantido.' : 'Secretaria ativada novamente.');
  }

  return (
    <div className="departmentManager">
      <section className="departmentHero">
        <div><span className="sectionKicker">GESTÃO</span><h1>Secretarias</h1><p>Cadastre as secretarias que podem solicitar materiais. Elas passam a aparecer automaticamente nas novas demandas, calendário e relatórios.</p></div>
        <div className="departmentHeroStats"><div><strong>{activeCount}</strong><span>ativas</span></div><div><strong>{departments.length}</strong><span>cadastradas</span></div></div>
      </section>

      <div className="departmentTopGrid">
        <section className="departmentCard">
          <div className="departmentCardHead"><div><span className="sectionKicker">CADASTRO</span><h2>Nova secretaria</h2></div></div>
          <form className="departmentCreateForm" onSubmit={createOne}>
            <label>Sigla<input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ex.: SEMOB" maxLength={20} /></label>
            <label className="wide">Nome completo<input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Secretaria Municipal de Obras" /></label>
            <button disabled={saving || !code.trim() || !name.trim()}>{saving ? 'Salvando...' : '+ Cadastrar'}</button>
          </form>
        </section>

        <section className="departmentCard bulkCard">
          <div className="departmentCardHead"><div><span className="sectionKicker">CADASTRO RÁPIDO</span><h2>Adicionar várias de uma vez</h2></div></div>
          <p>Uma por linha no formato <strong>SIGLA — Nome da secretaria</strong>.</p>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={'SEMOB — Secretaria Municipal de Obras\nSEMAGRI — Secretaria Municipal de Agricultura\nSEMEL — Secretaria Municipal de Esporte e Lazer'} />
          <button onClick={createBulk} disabled={saving || !bulkText.trim()}>Importar lista</button>
        </section>
      </div>

      {message && <div className="departmentMessage">{message}</div>}

      <section className="departmentListCard">
        <div className="departmentCardHead"><div><span className="sectionKicker">CADASTRADAS</span><h2>Secretarias do sistema</h2></div><span>{activeCount} ativa(s)</span></div>
        <div className="departmentList">
          {departments.map(item => (
            <article className={`departmentRow${item.active ? '' : ' inactive'}`} key={item.id}>
              <div className="departmentCode">{item.code}</div>
              <div className="departmentMain"><strong>{item.name}</strong><small>{item.demandCount} demanda(s) · {item.calendarCount} data(s) no calendário</small></div>
              <span className={`departmentStatus ${item.active ? 'active' : 'inactive'}`}>{item.active ? 'Ativa' : 'Desativada'}</span>
              <div className="departmentActions"><button onClick={() => setEditing(item)}>Editar</button><button className={item.active ? 'danger' : 'success'} onClick={() => toggle(item)}>{item.active ? 'Desativar' : 'Ativar'}</button></div>
            </article>
          ))}
        </div>
      </section>

      {editing && (
        <div className="departmentModalBackdrop" onMouseDown={e => { if (e.currentTarget === e.target) setEditing(null); }}>
          <section className="departmentModal">
            <header><div><span className="sectionKicker">EDITAR</span><h2>{editing.code}</h2></div><button onClick={() => setEditing(null)}>×</button></header>
            <label>Sigla<input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} /></label>
            <label>Nome completo<input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></label>
            <div className="departmentModalActions"><button className="secondary" onClick={() => setEditing(null)}>Cancelar</button><button onClick={saveEdit} disabled={saving}>Salvar alterações</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
