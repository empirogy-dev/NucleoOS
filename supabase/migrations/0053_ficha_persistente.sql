-- ============================================================
-- NucleoOS · Migración 0053 — Ficha que sí se guarda en la nube
-- Junta en una sola corrida las tres columnas nuevas de la ficha
-- (actividad, sexo y estado civil) por si alguna migración vieja
-- no alcanzó a correr. Todo es "add column if not exists", así que
-- es seguro correrla aunque las columnas ya existan.
-- Al final recarga el esquema para que Supabase las vea al toque.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.health_profile
  add column if not exists activity_level text
    check (activity_level in ('sedentaria', 'ligera', 'activa', 'atleta'));

alter table public.health_profile
  add column if not exists sex text
    check (sex in ('femenino', 'masculino'));

alter table public.health_profile
  add column if not exists civil_status text
    check (civil_status in ('soltera', 'en_pareja'));

-- Que PostgREST vea las columnas nuevas sin esperar el refresco automático.
notify pgrst, 'reload schema';
