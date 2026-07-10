-- ============================================================
-- NucleoOS · Migración 0014 — Desafío de hábitos (estilo Hábitos Atómicos)
-- Cada hábito puede tener una duración objetivo, por ejemplo 28 días.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.habits
  add column if not exists target_days int;
