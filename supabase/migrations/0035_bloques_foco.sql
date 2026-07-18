-- ============================================================
-- NucleoOS · Migración 0035 — Bloques de foco (pomodoro)
-- Cada bloque de enfoque terminado queda registrado con su duración
-- y, si lo ligaste, el proyecto de Trabajo o el área a la que empujó.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.focus_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null default current_date,
  minutes integer not null,
  label text,
  project_id uuid references public.projects(id) on delete set null,
  area text,
  created_at timestamptz not null default now()
);

alter table public.focus_blocks enable row level security;

drop policy if exists "focus select" on public.focus_blocks;
drop policy if exists "focus insert" on public.focus_blocks;
drop policy if exists "focus update" on public.focus_blocks;
drop policy if exists "focus delete" on public.focus_blocks;

create policy "focus select" on public.focus_blocks
  for select using (user_id = auth.uid());
create policy "focus insert" on public.focus_blocks
  for insert with check (user_id = auth.uid());
create policy "focus update" on public.focus_blocks
  for update using (user_id = auth.uid());
create policy "focus delete" on public.focus_blocks
  for delete using (user_id = auth.uid());
