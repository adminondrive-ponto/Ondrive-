import { ModulePage } from '@/components/module-page';

export default async function Page() {
  return ModulePage({ slug: 'pagamentos', pathname: '/pagamentos' });
}