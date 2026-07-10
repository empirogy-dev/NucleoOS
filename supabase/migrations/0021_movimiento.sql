-- ============================================================
-- NucleoOS · Migración 0021 — Movimiento
-- Progreso de los retos (7 y 21 días) y bucket privado
-- "material" para tus PDFs, clases y contenido propio.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.program_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  program_key text not null,
  day integer not null,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, program_key, day)
);

alter table public.program_days enable row level security;

drop policy if exists "program_days select" on public.program_days;
drop policy if exists "program_days insert" on public.program_days;
drop policy if exists "program_days delete" on public.program_days;

create policy "program_days select" on public.program_days
  for select using (user_id = auth.uid());
create policy "program_days insert" on public.program_days
  for insert with check (user_id = auth.uid());
create policy "program_days delete" on public.program_days
  for delete using (user_id = auth.uid());

-- Bucket privado para el material propio (PDFs, guías, clases).
insert into storage.buckets (id, name, public)
values ('material', 'material', false)
on conflict (id) do nothing;

drop policy if exists "material select" on storage.objects;
drop policy if exists "material insert" on storage.objects;
drop policy if exists "material update" on storage.objects;
drop policy if exists "material delete" on storage.objects;

create policy "material select" on storage.objects
  for select using (bucket_id = 'material' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "material insert" on storage.objects
  for insert with check (bucket_id = 'material' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "material update" on storage.objects
  for update using (bucket_id = 'material' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "material delete" on storage.objects
  for delete using (bucket_id = 'material' and (storage.foldername(name))[1] = auth.uid()::text);
