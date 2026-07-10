-- ============================================================
-- NucleoOS · Migración 0022 — Retos flexibles
-- Un reto es un compromiso vivo: editable, con frecuencia por
-- días de la semana, pausable y con progreso diario.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  why text,
  duration_days integer not null default 21,
  days_mask integer not null default 127, -- un bit por día de la semana, 127 = todos
  start_date date not null default current_date,
  status text not null default 'activo' check (status in ('activo', 'pausado', 'terminado')),
  created_at timestamptz not null default now()
);

alter table public.challenges enable row level security;

drop policy if exists "challenges select" on public.challenges;
drop policy if exists "challenges insert" on public.challenges;
drop policy if exists "challenges update" on public.challenges;
drop policy if exists "challenges delete" on public.challenges;

create policy "challenges select" on public.challenges
  for select using (user_id = auth.uid());
create policy "challenges insert" on public.challenges
  for insert with check (user_id = auth.uid());
create policy "challenges update" on public.challenges
  for update using (user_id = auth.uid());
create policy "challenges delete" on public.challenges
  for delete using (user_id = auth.uid());

create table if not exists public.challenge_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (challenge_id, date)
);

alter table public.challenge_logs enable row level security;

drop policy if exists "challenge_logs select" on public.challenge_logs;
drop policy if exists "challenge_logs insert" on public.challenge_logs;
drop policy if exists "challenge_logs delete" on public.challenge_logs;

create policy "challenge_logs select" on public.challenge_logs
  for select using (user_id = auth.uid());
create policy "challenge_logs insert" on public.challenge_logs
  for insert with check (user_id = auth.uid());
create policy "challenge_logs delete" on public.challenge_logs
  for delete using (user_id = auth.uid());
