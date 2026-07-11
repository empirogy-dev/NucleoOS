-- ============================================================
-- NucleoOS · Migración 0031 — Tu propio cumpleaños
-- Amor propio: la app también te celebra a ti.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.profiles
  add column if not exists birthday date;
