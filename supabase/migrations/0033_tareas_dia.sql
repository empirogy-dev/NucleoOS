-- ============================================================
-- NucleoOS · Migración 0033 — Tareas del día
-- El checklist del Inicio: cosas sueltas que no son hábito ni meta
-- (hacer la cama, lavar la ropa) pero que anotas para no olvidarlas.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.day_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null default current_date,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.day_tasks enable row level security;

drop policy if exists "day_tasks select" on public.day_tasks;
drop policy if exists "day_tasks insert" on public.day_tasks;
drop policy if exists "day_tasks update" on public.day_tasks;
drop policy if exists "day_tasks delete" on public.day_tasks;

create policy "day_tasks select" on public.day_tasks
  for select using (user_id = auth.uid());
create policy "day_tasks insert" on public.day_tasks
  for insert with check (user_id = auth.uid());
create policy "day_tasks update" on public.day_tasks
  for update using (user_id = auth.uid());
create policy "day_tasks delete" on public.day_tasks
  for delete using (user_id = auth.uid());
