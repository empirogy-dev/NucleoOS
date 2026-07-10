-- ============================================================
-- NucleoOS · Migración 0024 — Metas con progreso automático
-- Una meta puede alimentarse sola de lo que ya registras:
-- sesiones o minutos de movimiento, o sesiones de Mente.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.objectives
  add column if not exists auto_metric text
    check (auto_metric in ('mov_sesiones', 'mov_minutos', 'mente_sesiones'));

alter table public.objectives
  add column if not exists auto_target numeric;
