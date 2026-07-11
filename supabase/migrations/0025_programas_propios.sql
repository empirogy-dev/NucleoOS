-- ============================================================
-- NucleoOS · Migración 0025 — Programas propios de Movimiento
-- Además de los sugeridos, cada persona puede crear y editar
-- sus propios programas de días.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.user_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null,
  emoji text not null default '🌱',
  objetivo text,
  dias jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.user_programs enable row level security;

drop policy if exists "user_programs select" on public.user_programs;
drop policy if exists "user_programs insert" on public.user_programs;
drop policy if exists "user_programs update" on public.user_programs;
drop policy if exists "user_programs delete" on public.user_programs;

create policy "user_programs select" on public.user_programs
  for select using (user_id = auth.uid());
create policy "user_programs insert" on public.user_programs
  for insert with check (user_id = auth.uid());
create policy "user_programs update" on public.user_programs
  for update using (user_id = auth.uid());
create policy "user_programs delete" on public.user_programs
  for delete using (user_id = auth.uid());
