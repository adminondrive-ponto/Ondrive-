import { ProtectedPage } from '@/components/protected-page';
import { ModuleCrud } from '@/components/module-crud';
import { moduleConfigs, type ModuleSlug } from '@/lib/module-config';

export async function ModulePage({
  slug,
  pathname,
}: {
  slug: ModuleSlug;
  pathname: string;
}) {
  const config = moduleConfigs[slug];

  return (
    <ProtectedPage title={config.title} pathname={pathname}>
      <ModuleCrud config={config} />
    </ProtectedPage>
  );
}
