-- 0064: la deuda se calcula desde sus pagos, no se guarda a mano.
--
-- Registró todos los pagos de FairStone y la deuda siguió marcando los mismos
-- tres mil ciento veintisiete. Y tenía razón en reclamar: si uno anota los
-- pagos, la deuda tiene que bajar sola.
--
-- El problema era el modelo. Se guardaba UN número, el saldo actual, y cada
-- pago tenía que acordarse de restarlo. Cualquier operación que se saltara
-- ese paso, o que fallara a medio camino, dejaba el número mal para siempre,
-- sin forma de darse cuenta ni de arreglarlo.
--
-- Ahora se guarda el monto ORIGINAL de la deuda, que no cambia nunca, y el
-- saldo se calcula: original menos todo lo que se le ha abonado. Si un pago
-- se borra, la deuda sube sola. Si se agrega, baja sola. No hay forma de que
-- quede desalineada, porque no hay nada que mantener sincronizado.

alter table public.debts
  add column if not exists initial_balance numeric;

-- Las deudas que ya existen: su saldo actual pasa a ser el original, y desde
-- hoy los pagos que se registren la van bajando.
update public.debts
  set initial_balance = balance
  where initial_balance is null;

comment on column public.debts.initial_balance is
  'El monto original de la deuda. El saldo de hoy se calcula restándole los abonos registrados; no se guarda.';
