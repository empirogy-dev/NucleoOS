-- ============================================================
-- NucleoOS · Migración 0026 — Metas alimentadas por retos
-- Suma 'reto_dias' a las métricas del progreso automático,
-- para que un reto también empuje una meta de Dirección.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.objectives
  drop constraint if exists objectives_auto_metric_check;

alter table public.objectives
  add constraint objectives_auto_metric_check
  check (auto_metric in ('mov_sesiones', 'mov_minutos', 'mente_sesiones', 'habito_marcas', 'reto_dias'));
