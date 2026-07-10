-- ============================================================
-- NucleoOS · Migración 0018 — Energía diaria
-- Registro por día de agua, proteína y nivel de energía,
-- para la lectura rápida del estado del cuerpo.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.energy_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  water_cups integer not null default 0,
  protein_g numeric,
  energy_level integer check (energy_level between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.energy_logs enable row level security;

drop policy if exists "energy_logs select" on public.energy_logs;
drop policy if exists "energy_logs insert" on public.energy_logs;
drop policy if exists "energy_logs update" on public.energy_logs;
drop policy if exists "energy_logs delete" on public.energy_logs;

create policy "energy_logs select" on public.energy_logs
  for select using (user_id = auth.uid());
create policy "energy_logs insert" on public.energy_logs
  for insert with check (user_id = auth.uid());
create policy "energy_logs update" on public.energy_logs
  for update using (user_id = auth.uid());
create policy "energy_logs delete" on public.energy_logs
  for delete using (user_id = auth.uid());
