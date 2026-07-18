-- ============================================================
-- NucleoOS · Migración 0040 — Cada área alimenta sus metas
-- 1) Métrica 'ahorro_meta': una meta de Dirección se conecta a una
--    meta de ahorro de Finanzas (Viaje a Chile) y su porcentaje es el
--    dinero real aportado.
-- 2) Métrica 'rel_momentos': los momentos que registras en Relaciones
--    (con una persona o con cualquiera) empujan metas de esa área.
-- 3) Métrica 'libros_leidos': los libros que marcas como leídos en la
--    biblioteca de Aprendizaje empujan metas de esa área.
-- 4) Incluye 'foco_minutos' en el check (faltaba en la 0038).
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.objectives
  drop constraint if exists objectives_auto_metric_check;

alter table public.objectives
  add constraint objectives_auto_metric_check
  check (auto_metric in ('mov_sesiones', 'mov_minutos', 'mente_sesiones', 'habito_marcas', 'reto_dias', 'area_avances', 'trabajo_horas', 'foco_minutos', 'ahorro_meta', 'rel_momentos', 'libros_leidos'));
