import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app-shell';

type Profile = { role?: string | null };

export async function ProtectedPage({
  title,
  description,
  pathname,
  children,
}: {
  title: string;
  description?: string;
  pathname: string;
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect('/login');

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const profile = data as Profile | null;

  if (error || !profile || profile.role !== 'admin') redirect('/login');

  return (
    <AppShell title={title} description={description} pathname={pathname}>
      {children}
    </AppShell>
  );
}
