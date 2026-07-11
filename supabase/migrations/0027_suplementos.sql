-- ============================================================
-- NucleoOS · Migración 0027 — Suplementos
-- Los medicamentos y los suplementos comparten registro,
-- separados por tipo, cada uno con su tarjeta en Salud clínica.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.medications
  add column if not exists kind text not null default 'medicamento'
    check (kind in ('medicamento', 'suplemento'));
