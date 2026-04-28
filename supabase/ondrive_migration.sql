-- Ondrive - campos necessários para as melhorias do front
-- Execute este SQL no Supabase SQL Editor antes de testar salvar os novos campos.

alter table public.vehicles
  add column if not exists financing_status text,
  add column if not exists installments_total numeric,
  add column if not exists installment_value numeric,
  add column if not exists financing_end_date date,
  add column if not exists notes text;

alter table public.drivers
  add column if not exists cep text,
  add column if not exists address text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists cnh_due_date date,
  add column if not exists payment_weekday text,
  add column if not exists driver_score numeric,
  add column if not exists notes text;

alter table public.investors
  add column if not exists cpf text,
  add column if not exists phone text,
  add column if not exists active_cars numeric,
  add column if not exists partnership_type text,
  add column if not exists notes text;

alter table public.contracts
  add column if not exists investor_id uuid,
  add column if not exists contract_kind text,
  add column if not exists rent_value numeric,
  add column if not exists repasse_value numeric,
  add column if not exists payment_weekday text,
  add column if not exists monthly_payment_day numeric,
  add column if not exists allowed_delay_days numeric,
  add column if not exists late_fee numeric,
  add column if not exists contract_file_url text,
  add column if not exists photos_url text,
  add column if not exists notes text;

alter table public.financial_entries
  add column if not exists investor_id uuid,
  add column if not exists vehicle_id uuid,
  add column if not exists repasse_value numeric,
  add column if not exists notes text;

alter table public.fines
  add column if not exists due_date date,
  add column if not exists status text,
  add column if not exists description text;
