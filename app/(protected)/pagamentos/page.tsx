import { ModuleCrud } from '@/components/module-crud';
import { moduleConfigs } from '@/lib/module-config';

export default function PagamentosPage() {
  return <ModuleCrud config={moduleConfigs.pagamentos} />;
}