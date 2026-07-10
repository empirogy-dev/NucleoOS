-- ============================================================
-- NucleoOS · Migración 0019 — Sueños y vida ideal (módulo Visión)
-- Bucket list de sueños, bloques de vida ideal, y el puente
-- sueño → meta (dream_id en objectives).
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'otro',
  why text,
  priority integer not null default 2 check (priority between 1 and 3),
  status text not null default 'idea' check (status in ('idea', 'importante', 'meta')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.dreams enable row level security;

drop policy if exists "dreams select" on public.dreams;
drop policy if exists "dreams insert" on public.dreams;
drop policy if exists "dreams update" on public.dreams;
drop policy if exists "dreams delete" on public.dreams;

create policy "dreams select" on public.dreams
  for select using (user_id = auth.uid());
create policy "dreams insert" on public.dreams
  for insert with check (user_id = auth.uid());
create policy "dreams update" on public.dreams
  for update using (user_id = auth.uid());
create policy "dreams delete" on public.dreams
  for delete using (user_id = auth.uid());

create table if not exists public.ideal_life (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  section text not null,
  content text,
  updated_at timestamptz not null default now(),
  unique (user_id, section)
);

alter table public.ideal_life enable row level security;

drop policy if exists "ideal_life select" on public.ideal_life;
drop policy if exists "ideal_life insert" on public.ideal_life;
drop policy if exists "ideal_life update" on public.ideal_life;
drop policy if exists "ideal_life delete" on public.ideal_life;

create policy "ideal_life select" on public.ideal_life
  for select using (user_id = auth.uid());
create policy "ideal_life insert" on public.ideal_life
  for insert with check (user_id = auth.uid());
create policy "ideal_life update" on public.ideal_life
  for update using (user_id = auth.uid());
create policy "ideal_life delete" on public.ideal_life
  for delete using (user_id = auth.uid());

-- El puente entre Visión y Dirección: una meta puede nacer de un sueño.
alter table public.objectives
  add column if not exists dream_id uuid references public.dreams(id) on delete set null;
