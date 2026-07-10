-- ============================================================
-- NucleoOS · Migración 0023 — Diario de Mente
-- Journaling con preguntas guía: gratitud, reencuadre y escritura libre.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null default current_date,
  prompt text,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.journal_entries enable row level security;

drop policy if exists "journal select" on public.journal_entries;
drop policy if exists "journal insert" on public.journal_entries;
drop policy if exists "journal update" on public.journal_entries;
drop policy if exists "journal delete" on public.journal_entries;

create policy "journal select" on public.journal_entries
  for select using (user_id = auth.uid());
create policy "journal insert" on public.journal_entries
  for insert with check (user_id = auth.uid());
create policy "journal update" on public.journal_entries
  for update using (user_id = auth.uid());
create policy "journal delete" on public.journal_entries
  for delete using (user_id = auth.uid());
