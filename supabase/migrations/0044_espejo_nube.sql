-- ============================================================
-- NucleoOS · Migración 0044 — Tus datos del navegador, a la nube
-- Lo que vivía solo en el navegador (sesiones de Mente, libros
-- marcados, rutinas guiadas, menú de dopamina, ayuno, ciclo,
-- bloques de pomodoro y la memoria del automarcado) ahora se
-- respalda en esta tabla y te sigue del computador al celular.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.user_kv (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_kv enable row level security;

drop policy if exists "user_kv select" on public.user_kv;
drop policy if exists "user_kv insert" on public.user_kv;
drop policy if exists "user_kv update" on public.user_kv;
drop policy if exists "user_kv delete" on public.user_kv;

create policy "user_kv select" on public.user_kv
  for select using (user_id = auth.uid());
create policy "user_kv insert" on public.user_kv
  for insert with check (user_id = auth.uid());
create policy "user_kv update" on public.user_kv
  for update using (user_id = auth.uid());
create policy "user_kv delete" on public.user_kv
  for delete using (user_id = auth.uid());
