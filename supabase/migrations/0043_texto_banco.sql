-- ============================================================
-- NucleoOS · Migración 0043 — El texto del banco a su propio lugar
-- El texto crudo de la cartola ("[PR]SEPHORA KELOWNA KELOWNA BC")
-- estaba ocupando la Descripción. Ahora vive en bank_ref (la firma
-- del movimiento, para detectar duplicados y aplicar reglas), y la
-- Descripción queda libre para lo que de verdad es: qué fue el gasto.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.transactions
  add column if not exists bank_ref text;

update public.transactions
  set bank_ref = description
  where source in ('cartola', 'banco')
    and bank_ref is null
    and description <> '';

-- La descripción que era solo el texto del banco queda en blanco:
-- ahora es tuya, para anotar qué fue el gasto si quieres.
update public.transactions
  set description = ''
  where source in ('cartola', 'banco')
    and description = bank_ref;
