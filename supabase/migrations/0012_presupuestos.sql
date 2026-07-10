-- ============================================================
-- NucleoOS · Migración 0012 — Presupuestos avanzados (de Fluxney)
-- Excluir del presupuesto y fondo de arrastre (rollover).
-- budget_mode ya existía desde la migración 0001.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.categories
  add column if not exists exclude_from_budget boolean not null default false,
  add column if not exists rollover_fund boolean not null default false;
