-- ============================================================
-- NucleoOS · Migración 0049 — La lista completa de métricas
-- El permiso de métricas automáticas (check de objectives) quedó con
-- una versión anterior de la lista y rechazaba las métricas nuevas
-- (momentos con una persona y leer libros). Esta lo reconstruye con
-- las once métricas actuales. Es segura de correr las veces que sea.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.objectives
  drop constraint if exists objectives_auto_metric_check;

alter table public.objectives
  add constraint objectives_auto_metric_check
  check (auto_metric in ('mov_sesiones', 'mov_minutos', 'mente_sesiones', 'habito_marcas', 'reto_dias', 'area_avances', 'trabajo_horas', 'foco_minutos', 'ahorro_meta', 'rel_momentos', 'libros_leidos'));
