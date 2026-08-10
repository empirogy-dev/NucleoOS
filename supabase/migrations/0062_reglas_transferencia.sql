-- 0062: una regla de comercio también recuerda QUÉ ES el movimiento.
--
-- Hasta ahora la automatización guardaba el nombre del comercio y su
-- categoría. Servía para gastos, pero no para lo que no es un gasto: marcar
-- un "PAYMENT" como transferencia hacia la tarjeta y pedir que se automatice
-- no hacía nada con los siguientes, porque el tipo no se guardaba en ninguna
-- parte. Había que corregirlos uno por uno, todos los meses.

alter table public.merchant_rules
  add column if not exists tx_type text
    check (tx_type in ('income', 'expense', 'transfer')),
  add column if not exists destination_kind text,
  add column if not exists destination_ref uuid;

comment on column public.merchant_rules.tx_type is
  'Si la regla también fija el tipo del movimiento: gasto, ingreso o transferencia. Vacío deja el tipo que traiga el banco.';
comment on column public.merchant_rules.destination_kind is
  'Para transferencias: a dónde va (card, debt, goal, account).';
