import { ProtectedPage } from '@/components/protected-page';
import DashboardOverview from '@/components/dashboard-overview';

export default function DashboardPage() {
  return (
    <ProtectedPage title="Painel Operacional" pathname="/dashboard">
      <DashboardOverview />
    </ProtectedPage>
  );
}