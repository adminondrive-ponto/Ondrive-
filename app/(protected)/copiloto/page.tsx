import { ProtectedPage } from '@/components/protected-page';
import { CopilotChat } from '@/components/copilot-chat';

export default async function CopilotoPage() {
  return ProtectedPage({
    title: 'IAdrive',
    pathname: '/copiloto',
    children: <CopilotChat />,
  });
}
