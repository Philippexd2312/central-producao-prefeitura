'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewTeamMemberForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get('name'),
      email: form.get('email'),
      role: form.get('role'),
      password: form.get('password'),
    };

    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Não foi possível cadastrar o profissional.');
        return;
      }
      router.push('/equipe');
      router.refresh();
    } catch {
      setError('Não foi possível cadastrar o profissional.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="newMemberForm" onSubmit={submit}>
      {error && <div className="loginError full">{error}</div>}
      <label>
        <span>Nome</span>
        <input name="name" required placeholder="Nome do profissional" />
      </label>
      <label>
        <span>E-mail de acesso</span>
        <input name="email" type="email" required placeholder="nome@prefeitura.local" />
      </label>
      <label>
        <span>Cargo</span>
        <select name="role" defaultValue="DESIGNER" required>
          <option value="DESIGNER">Designer</option>
          <option value="EDITOR">Editor de vídeo</option>
          <option value="COPYWRITER">Redação</option>
          <option value="SOCIAL_MEDIA">Social media</option>
          <option value="MANAGER">Gestão</option>
        </select>
      </label>
      <label>
        <span>Senha inicial</span>
        <input name="password" type="password" minLength={8} required placeholder="Mínimo 8 caracteres" />
      </label>
      <div className="newMemberActions">
        <Link href="/equipe">Cancelar</Link>
        <button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar profissional'}</button>
      </div>
    </form>
  );
}
