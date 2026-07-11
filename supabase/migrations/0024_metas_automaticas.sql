-- ============================================================
-- NucleoOS · Migración 0024 — Metas con progreso automático
-- Una meta puede alimentarse sola de lo que ya registras:
-- movimiento, sesiones de Mente, o los días de un hábito.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.objectives
  add column if not exists auto_metric text
    check (auto_metric in ('mov_sesiones', 'mov_minutos', 'mente_sesiones', 'habito_marcas'));

alter table public.objectives
  add column if not exists auto_target numeric;

-- Referencia opcional: qué hábito alimenta la meta (para habito_marcas).
alter table public.objectives
  add column if not exists auto_ref uuid;
