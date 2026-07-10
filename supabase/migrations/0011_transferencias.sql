-- ============================================================
-- NucleoOS · Migración 0011 — Transferencias estilo QuickBooks
-- El destino de una transferencia puede ser una cuenta, una
-- tarjeta de crédito, una deuda o una meta de ahorro.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.transactions
  add column if not exists destination_kind text,   -- account | card | debt | goal
  add column if not exists destination_ref uuid;

-- Las transferencias antiguas (solo entre cuentas) se migran al formato nuevo.
update public.transactions
  set destination_kind = 'account', destination_ref = destination_account_id
  where destination_account_id is not null and destination_kind is null;
