-- ============================================================
-- NucleoOS · Migración 0032 — Sexo en la ficha
-- Necesario para calcular tus calorías de mantenimiento (TDEE)
-- con la fórmula de Mifflin St Jeor.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- Si después aparece un error de esquema, corre también:
--   NOTIFY pgrst, 'reload schema';
-- ============================================================

alter table public.health_profile
  add column if not exists sex text
    check (sex in ('femenino', 'masculino'));
