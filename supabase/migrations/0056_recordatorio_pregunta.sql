-- ============================================================
-- NucleoOS · Migración 0056 — Recordatorios que preguntan
-- Un recordatorio normal te avisa ("⏰ tomar suplementos"). Uno con
-- pregunta = true te lo pregunta y registra tu respuesta, así cada
-- persona arma sus propios check-ins, más allá de los tres que trae la app.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.wa_recordatorios
  add column if not exists pregunta boolean not null default false;
