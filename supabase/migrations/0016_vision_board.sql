-- ============================================================
-- NucleoOS · Migración 0016 — Tablero de visión (visual board)
-- Bucket privado para las imágenes de lo que quieres proyectar.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

insert into storage.buckets (id, name, public)
values ('vision', 'vision', false)
on conflict (id) do nothing;

drop policy if exists "vision select" on storage.objects;
drop policy if exists "vision insert" on storage.objects;
drop policy if exists "vision update" on storage.objects;
drop policy if exists "vision delete" on storage.objects;

create policy "vision select" on storage.objects
  for select using (bucket_id = 'vision' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vision insert" on storage.objects
  for insert with check (bucket_id = 'vision' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vision update" on storage.objects
  for update using (bucket_id = 'vision' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vision delete" on storage.objects
  for delete using (bucket_id = 'vision' and (storage.foldername(name))[1] = auth.uid()::text);
