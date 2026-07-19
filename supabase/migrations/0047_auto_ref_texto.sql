-- ============================================================
-- NucleoOS · Migración 0047 — auto_ref deja de ser uuid
-- Las conexiones automáticas nuevas guardan referencias que no son
-- uuid: "l:<libros elegidos>", "v:<vía de la biblioteca>",
-- "p:<proyecto>" o "a:aprendizaje" para el foco. La columna pasa a
-- texto y todo lo existente (uuids de hábitos, retos, proyectos,
-- personas y metas de ahorro) se conserva tal cual.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.objectives
  alter column auto_ref type text using auto_ref::text;
