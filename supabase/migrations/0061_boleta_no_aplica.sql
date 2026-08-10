-- 0061: marcar un movimiento como "no necesita boleta".
--
-- Un gasto se archiva cuando está categorizado Y tiene su comprobante. Pero
-- hay gastos que no van a tener boleta nunca: la suscripción que se cobra
-- sola, el interés del banco, la comisión mensual. Sin una forma de decirlo,
-- la bandeja "Sin boleta" no bajaría nunca de cierto número y se volvería
-- ruido, que es justo lo contrario de para qué existe.
--
-- Con esto la bandeja puede llegar a cero de verdad, que es lo único que
-- hace que uno vuelva a mirarla.

alter table public.transactions
  add column if not exists receipt_waived boolean not null default false;

comment on column public.transactions.receipt_waived is
  'La persona dijo que este movimiento no necesita comprobante. Se archiva igual.';
