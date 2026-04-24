import { ProtectedPage } from '@/components/protected-page';
import { DashboardOverview } from '@/components/dashboard-overview';

export default async function DashboardPage() {
  return ProtectedPage({
    title: 'Painel Operacional',
    pathname: '/dashboard',
    children: <DashboardOverview />,
  });
}
