'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { LogoutButton } from '@/components/auth-actions';
import { menuItems } from '@/lib/module-config';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
export function AppShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  pathname?: string;
}) {
  const router = useRouter();

useEffect(() => {
  const abaAtiva = sessionStorage.getItem('ondrive_login_aba_ativa');

  if (abaAtiva !== 'sim') {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.signOut().finally(() => {
      router.replace('/login');
      router.refresh();
    });
  }
}, [router]);

return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Ondrive</div>

        <nav className="nav-links">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a
            className="btn support-btn"
            href="https://wa.me/5511940256385"
            target="_blank"
            rel="noreferrer"
          >
            Suporte WhatsApp
          </a>
          <LogoutButton />
        </div>
      </aside>

      <main className="main-content">
        {title ? (
          <header className="page-header">
            <div className="page-title">
              <h1>{title}</h1>
            </div>
          </header>
        ) : null}
        {children}
      </main>
    </div>
  );
}
