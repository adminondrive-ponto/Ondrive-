import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'OnDrive SaaS',
  description: 'Plataforma profissional de gestão de frota',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
