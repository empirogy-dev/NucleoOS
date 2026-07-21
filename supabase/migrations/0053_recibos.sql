-- ============================================================
-- NucleoOS · Migración 0053 — Boletas por transacción
-- Almacenamiento privado para adjuntar el comprobante (foto o PDF) a
-- cada movimiento de Finanzas, como en QuickBooks.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

-- Bucket privado para las boletas. Ruta: {userId}/{txId}/{archivo}.
insert into storage.buckets (id, name, public)
values ('recibos', 'recibos', false)
on conflict (id) do nothing;

drop policy if exists "recibos select" on storage.objects;
drop policy if exists "recibos insert" on storage.objects;
drop policy if exists "recibos update" on storage.objects;
drop policy if exists "recibos delete" on storage.objects;

create policy "recibos select" on storage.objects
  for select using (bucket_id = 'recibos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "recibos insert" on storage.objects
  for insert with check (bucket_id = 'recibos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "recibos update" on storage.objects
  for update using (bucket_id = 'recibos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "recibos delete" on storage.objects
  for delete using (bucket_id = 'recibos' and (storage.foldername(name))[1] = auth.uid()::text);
