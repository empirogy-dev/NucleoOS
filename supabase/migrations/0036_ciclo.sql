-- ============================================================
-- NucleoOS · Migración 0036 — Ciclo menstrual
-- Registro de cada regla para calcular tu fase hormonal, predecir
-- la próxima y avisarle a tu pareja cómo apoyarte.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- Si después ves un error de esquema, corre también:
--   NOTIFY pgrst, 'reload schema';
-- ============================================================

create table if not exists public.cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  start_date date not null,
  created_at timestamptz not null default now()
);

alter table public.cycles enable row level security;

drop policy if exists "cycles select" on public.cycles;
drop policy if exists "cycles insert" on public.cycles;
drop policy if exists "cycles update" on public.cycles;
drop policy if exists "cycles delete" on public.cycles;

create policy "cycles select" on public.cycles
  for select using (user_id = auth.uid());
create policy "cycles insert" on public.cycles
  for insert with check (user_id = auth.uid());
create policy "cycles update" on public.cycles
  for update using (user_id = auth.uid());
create policy "cycles delete" on public.cycles
  for delete using (user_id = auth.uid());

-- Configuración del ciclo en la ficha
alter table public.health_profile
  add column if not exists cycle_length integer;
alter table public.health_profile
  add column if not exists period_length integer;
alter table public.health_profile
  add column if not exists partner_email text;
