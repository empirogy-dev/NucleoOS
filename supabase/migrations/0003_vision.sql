-- ============================================================
-- NucleoOS · Migración 0003 — Visión de vida en el perfil
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.profiles
  add column if not exists life_vision text;
