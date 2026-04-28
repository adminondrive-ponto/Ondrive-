import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();

  if (data.session) redirect('/dashboard');

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Ondrive</h1>
        <LoginForm />
      </div>
    </div>
  );
}
