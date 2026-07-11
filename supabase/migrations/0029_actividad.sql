-- ============================================================
-- NucleoOS · Migración 0029 — Nivel de actividad en la ficha
-- Con peso y nivel de actividad, la meta de proteína se calcula
-- sola: quien entrena casi a diario necesita mucho más.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.health_profile
  add column if not exists activity_level text
    check (activity_level in ('sedentaria', 'ligera', 'activa', 'atleta'));
