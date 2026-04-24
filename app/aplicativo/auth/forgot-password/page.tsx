'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

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

      setMessage('Se o e-mail existir, você receberá um link para redefinir a senha.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao enviar e-mail');
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
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {message && <div className="alert">{message}</div>}

          <div className="field full">
            <button className="btn primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>

            <Link href="/login">Voltar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
