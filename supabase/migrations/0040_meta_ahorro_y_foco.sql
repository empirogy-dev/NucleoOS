-- ============================================================
-- NucleoOS · Migración 0040 — Metas por ahorro y foco
-- 1) Métrica 'ahorro_meta': una meta de Dirección se conecta a una
--    meta de ahorro de Finanzas (Viaje a Chile) y su porcentaje es el
--    dinero real aportado.
-- 2) Incluye 'foco_minutos' en el check (faltaba en la 0038).
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.objectives
  drop constraint if exists objectives_auto_metric_check;

alter table public.objectives
  add constraint objectives_auto_metric_check
  check (auto_metric in ('mov_sesiones', 'mov_minutos', 'mente_sesiones', 'habito_marcas', 'reto_dias', 'area_avances', 'trabajo_horas', 'foco_minutos', 'ahorro_meta'));
