import { ProtectedPage } from '@/components/protected-page';
import { AlertsCenter } from '@/components/alerts-center';

export default async function AlertasPage() {
  return ProtectedPage({
    title: 'Alertas',
    pathname: '/alertas',
    children: <AlertsCenter />,
  });
}
