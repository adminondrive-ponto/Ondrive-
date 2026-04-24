import { ProtectedPage } from '@/components/protected-page';
import { FinancialDashboard } from '@/components/financial-dashboard';

export default async function FinanceiroPage() {
  return ProtectedPage({
    title: 'Painel Financeiro',
    pathname: '/financeiro',
    children: <FinancialDashboard />,
  });
}
