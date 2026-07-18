-- ============================================================
-- NucleoOS · Migración 0039 — Estado civil y fuentes del collage
-- 1) Estado civil en la ficha: si estás soltera, la sección de pareja
--    del ciclo se oculta y los consejos te hablan a ti sola.
-- 2) Cada nota del visual board puede elegir su tipo de letra
--    (normal, títulos o caligrafía).
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- Si después ves un error de esquema, corre también:
--   NOTIFY pgrst, 'reload schema';
-- ============================================================

alter table public.health_profile
  add column if not exists civil_status text
    check (civil_status in ('soltera', 'en_pareja'));

alter table public.vision_items
  add column if not exists font text
    check (font in ('normal', 'titulo', 'caligrafia'));
