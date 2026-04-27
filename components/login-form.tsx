'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

     if (error) {
  setMessage(error.message);
  return;
}

sessionStorage.setItem('ondrive_login_aba_ativa', 'sim');

router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <div className="field full">
        <label>E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin.ondrive@gmail.com"
          required
        />
      </div>

      <div className="field full">
        <label>Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      {message ? <div className="alert">{message}</div> : null}

      <div className="field full" style={{ gap: 12 }}>
        <button className="btn primary" disabled={loading} type="submit">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <Link
          href="/aplicativo/auth/forgot-password"
          style={{ color: 'var(--primary)', fontWeight: 600 }}
        >
          Esqueci minha senha
        </Link>
      </div>
    </form>
  );
}
