-- Endurecimento de segurança validado na auditoria
-- Mantém o modelo admin + RLS + Supabase Auth

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(public.profiles.name, excluded.name),
      role = coalesce(public.profiles.role, 'user'),
      updated_at = now();

  return new;
end;
$function$;

drop policy if exists profiles_no_role_update on public.profiles;

create policy profiles_no_role_update
on public.profiles
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select role from public.profiles where id = auth.uid())
);

revoke all on public.profiles from anon;
revoke all on public.company_settings from anon;
revoke all on public.contract_types from anon;
revoke all on public.contracts from anon;
revoke all on public.dismissed_alerts from anon;
revoke all on public.drivers from anon;
revoke all on public.financial_entries from anon;
revoke all on public.financial_logs from anon;
revoke all on public.fines from anon;
revoke all on public.ia_history from anon;
revoke all on public.inspections from anon;
revoke all on public.investors from anon;
revoke all on public.knowledge_base from anon;
revoke all on public.manual_alerts from anon;
revoke all on public.vehicles from anon;

revoke references, trigger, truncate on public.profiles from authenticated;

grant select, insert, update, delete on public.company_settings to authenticated;
grant select, insert, update, delete on public.contract_types to authenticated;
grant select, insert, update, delete on public.contracts to authenticated;
grant select, insert, update, delete on public.dismissed_alerts to authenticated;
grant select, insert, update, delete on public.drivers to authenticated;
grant select, insert, update, delete on public.financial_entries to authenticated;
grant select, insert, update, delete on public.financial_logs to authenticated;
grant select, insert, update, delete on public.fines to authenticated;
grant select, insert, update, delete on public.ia_history to authenticated;
grant select, insert, update, delete on public.inspections to authenticated;
grant select, insert, update, delete on public.investors to authenticated;
grant select, insert, update, delete on public.knowledge_base to authenticated;
grant select, insert, update, delete on public.manual_alerts to authenticated;
grant select, insert, update, delete on public.vehicles to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
