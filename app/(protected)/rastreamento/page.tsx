import { ProtectedPage } from '@/components/protected-page';
import { VehicleTracker } from '@/components/vehicle-tracker';

export default function RastreamentoPage() {
  return (
    <ProtectedPage title="Rastreamento de Veículos" pathname="/rastreamento">
      <VehicleTracker />
    </ProtectedPage>
  );
}