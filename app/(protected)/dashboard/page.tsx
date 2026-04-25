import DashboardOverview from '@/components/dashboard-overview';

export default function DashboardPage() {
  return (
    <main style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '8px' }}>Painel operacional</h1>
      <p style={{ marginBottom: '24px', color: '#64748b' }}>
        Visão geral da frota, motoristas e sócios cadastrados.
      </p>

      <DashboardOverview />
    </main>
  );
}
