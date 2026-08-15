-- 0063: "este gasto me lo reembolsaron".
--
-- Compró en Costco para el trabajo y le devolvieron la plata. Ese gasto
-- existió, la boleta existe y hay que guardarla, pero al final del día no lo
-- pagó ella: se lo pagaron. Y un gasto que otro te reembolsó NO se puede
-- deducir en la declaración de impuestos.
--
-- Hasta ahora la única forma de sacarlo de los impuestos era inventarle una
-- categoría aparte sin línea, lo que ensucia la lista de categorías y obliga
-- a decidir el tema al momento de categorizar. Con una marca por movimiento,
-- el gasto se queda en su categoría de verdad (Comida es Comida) y solo se
-- excluye de donde no corresponde: los impuestos y el presupuesto.

alter table public.transactions
  add column if not exists reimbursed boolean not null default false;

comment on column public.transactions.reimbursed is
  'Alguien le devolvió esta plata. El gasto se guarda con su boleta, pero no cuenta para impuestos ni para el presupuesto.';

create index if not exists ix_tx_reimbursed
  on public.transactions (user_id) where reimbursed;
