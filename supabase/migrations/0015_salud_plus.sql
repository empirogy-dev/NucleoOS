-- ============================================================
-- NucleoOS · Migración 0015 — Salud plus (bloque E del reporte)
-- Ficha ampliada y almacenamiento privado para resultados de exámenes.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.health_profile
  add column if not exists weight_kg numeric,
  add column if not exists height_cm numeric,
  add column if not exists diet text,
  add column if not exists eye_color text;

-- Bucket privado para los PDF y fotos de resultados de exámenes.
insert into storage.buckets (id, name, public)
values ('salud', 'salud', false)
on conflict (id) do nothing;

drop policy if exists "salud select" on storage.objects;
drop policy if exists "salud insert" on storage.objects;
drop policy if exists "salud update" on storage.objects;
drop policy if exists "salud delete" on storage.objects;

create policy "salud select" on storage.objects
  for select using (bucket_id = 'salud' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "salud insert" on storage.objects
  for insert with check (bucket_id = 'salud' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "salud update" on storage.objects
  for update using (bucket_id = 'salud' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "salud delete" on storage.objects
  for delete using (bucket_id = 'salud' and (storage.foldername(name))[1] = auth.uid()::text);
