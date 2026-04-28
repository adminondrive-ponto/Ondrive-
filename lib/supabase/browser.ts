'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

let supabase: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (supabase) return supabase;

  supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  return supabase;
}
