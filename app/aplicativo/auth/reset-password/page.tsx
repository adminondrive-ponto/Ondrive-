'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage('Senha atualizada com sucesso.');
      router.replace('/login');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Ondrive</h1>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field full">
            <label>Nova senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </div>
          {message ? <div className="alert">{message}</div> : null}
          <div className="field full">
            <button className="btn primary" disabled={loading} type="submit">
              {loading ? 'Atualizando...' : 'Atualizar senha'}
            </button>
            <Link href="/login">Voltar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
