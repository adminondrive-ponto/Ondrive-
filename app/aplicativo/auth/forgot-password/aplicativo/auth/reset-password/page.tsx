'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/aplicativo/auth/reset-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage('Enviamos um link para redefinir sua senha. Verifique seu e-mail.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao enviar e-mail.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Ondrive</h1>
        <p>Recuperar senha</p>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field full">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Digite seu e-mail"
            />
          </div>

          {message && <div className="alert">{message}</div>}

          <div className="field full">
            <button className="btn primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </div>

          <div className="field full">
            <Link href="/login">Voltar para o login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
