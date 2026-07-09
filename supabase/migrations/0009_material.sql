-- ============================================================
-- NucleoOS · Migración 0009 — Material de Aprendizaje (archivos)
-- Crea el bucket privado y sus políticas: cada usuario solo ve
-- los archivos de su propia carpeta.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

insert into storage.buckets (id, name, public)
values ('aprendizaje', 'aprendizaje', false)
on conflict (id) do nothing;

drop policy if exists "aprendizaje select" on storage.objects;
drop policy if exists "aprendizaje insert" on storage.objects;
drop policy if exists "aprendizaje update" on storage.objects;
drop policy if exists "aprendizaje delete" on storage.objects;

create policy "aprendizaje select" on storage.objects
  for select using (
    bucket_id = 'aprendizaje' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "aprendizaje insert" on storage.objects
  for insert with check (
    bucket_id = 'aprendizaje' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "aprendizaje update" on storage.objects
  for update using (
    bucket_id = 'aprendizaje' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "aprendizaje delete" on storage.objects
  for delete using (
    bucket_id = 'aprendizaje' and (storage.foldername(name))[1] = auth.uid()::text
  );
