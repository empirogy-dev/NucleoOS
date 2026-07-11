-- ============================================================
-- NucleoOS · Migración 0028 — Metas alimentadas por avances de área
-- Suma 'area_avances' a las métricas: una meta de Aprendizaje (o de
-- cualquier área) avanza con los avances que registras en esa área.
-- Incluye también 'reto_dias' por si la 0026 no se corrió.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.objectives
  drop constraint if exists objectives_auto_metric_check;

alter table public.objectives
  add constraint objectives_auto_metric_check
  check (auto_metric in ('mov_sesiones', 'mov_minutos', 'mente_sesiones', 'habito_marcas', 'reto_dias', 'area_avances'));
