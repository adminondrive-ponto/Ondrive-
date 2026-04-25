import { AppShell } from '@/components/app-shell';
import AlertsCenter from '@/components/alerts-center';

export default function AlertasPage() {
  return (
    <AppShell title="Alertas" pathname="/alertas">
      <AlertsCenter />
    </AppShell>
  );
}