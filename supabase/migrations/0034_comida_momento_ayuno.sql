-- ============================================================
-- NucleoOS · Migración 0034 — Momento de comida y hora del bocado
-- Para marcar cada plato como desayuno, almuerzo, cena o snack,
-- y para el contador de ayuno (horas desde tu última comida).
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- Si después ves un error de esquema, corre también:
--   NOTIFY pgrst, 'reload schema';
-- ============================================================

alter table public.meals
  add column if not exists meal_type text
    check (meal_type in ('desayuno', 'almuerzo', 'cena', 'snack'));

alter table public.meals
  add column if not exists eaten_at timestamptz;
