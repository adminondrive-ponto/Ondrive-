'use client';

import Link from 'next/link';

export default function Sidebar() {
  return (
    <div
      style={{
        width: '220px',
        height: '100vh',
        background: '#0f172a',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 10px',
      }}
    >
      {/* LOGO */}
      <h2 style={{ marginBottom: '20px' }}>Ondrive</h2>

      {/* MENU */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Link href="/dashboard">Painel Administrativo</Link>
        <Link href="/operacional">Painel Operacional</Link>
        <Link href="/alertas">Alertas</Link>
        <Link href="/financeiro">Painel Financeiro</Link>
        <Link href="/veiculos">Veículos</Link>
        <Link href="/motoristas">Motoristas</Link>
        <Link href="/contratos">Contratos</Link>
        <Link href="/vistorias">Vistorias</Link>
        <Link href="/multas">Multas</Link>
        <Link href="/socios">Sócios</Link>
        <Link href="/drive">IAdrive</Link>
      </nav>

      {/* BOTÕES (AGORA NO LUGAR CERTO) */}
      <div style={{ marginTop: '30px' }}>
        <a
          href="https://wa.me/SEUNUMERO"
          target="_blank"
          style={{
            display: 'block',
            background: '#22c55e',
            padding: '10px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '10px',
            textDecoration: 'none',
            color: '#fff',
          }}
        >
          Suporte WhatsApp
        </a>

        <button
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            background: '#fff',
            color: '#000',
            cursor: 'pointer',
          }}
          onClick={() => {
            alert('Logout aqui');
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}