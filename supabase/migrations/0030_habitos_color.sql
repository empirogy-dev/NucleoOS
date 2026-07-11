-- ============================================================
-- NucleoOS · Migración 0030 — Color y minutos por hábito
-- Cada hábito puede tener su propio color para la cuadrícula
-- y un tiempo diario opcional (10 minutos de proyección familiar).
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.habits
  add column if not exists color text;

alter table public.habits
  add column if not exists daily_minutes integer;
