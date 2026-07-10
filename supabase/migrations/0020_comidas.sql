-- ============================================================
-- NucleoOS · Migración 0020 — Comidas del día
-- Cada plato registrado (a mano o con foto analizada por IA)
-- guarda sus macros estimados para el acumulado diario.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  description text not null,
  kcal integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  satiety integer check (satiety between 1 and 5),
  impact text,
  created_at timestamptz not null default now()
);

alter table public.meals enable row level security;

drop policy if exists "meals select" on public.meals;
drop policy if exists "meals insert" on public.meals;
drop policy if exists "meals update" on public.meals;
drop policy if exists "meals delete" on public.meals;

create policy "meals select" on public.meals
  for select using (user_id = auth.uid());
create policy "meals insert" on public.meals
  for insert with check (user_id = auth.uid());
create policy "meals update" on public.meals
  for update using (user_id = auth.uid());
create policy "meals delete" on public.meals
  for delete using (user_id = auth.uid());
