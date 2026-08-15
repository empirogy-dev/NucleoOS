-- 0065: el saldo de una tarjeta también se calcula, no se guarda a mano.
--
-- Es exactamente el mismo error que tenía la deuda, y por eso arreglar la
-- deuda no arregló las tarjetas: la American Express seguía mal.
--
-- Se guardaba UN número, lo adeudado hoy, y cada compra tenía que acordarse
-- de sumarlo y cada pago de restarlo. Una tarjeta con casi cinco mil de deuda
-- terminó marcando cero, y después de un pago de doscientos quedó en MENOS
-- doscientos, con un cupo usado de menos cuatro por ciento. Números que no
-- existen.
--
-- Ahora se guarda lo adeudado ORIGINAL, el punto de partida, y el saldo de
-- hoy se calcula: original, más lo que se compró con la tarjeta, menos lo que
-- se le ha pagado. Si un movimiento se borra o se corrige, el saldo se
-- reacomoda solo.
--
-- Las tarjetas conectadas a un banco no usan nada de esto: ahí manda el saldo
-- que entrega el banco, que es quien de verdad sabe.

alter table public.credit_cards
  add column if not exists initial_balance numeric;

update public.credit_cards
  set initial_balance = balance
  where initial_balance is null;

comment on column public.credit_cards.initial_balance is
  'Lo adeudado al empezar a registrar. El saldo de hoy se calcula sumando las compras y restando los pagos; no se guarda. En tarjetas del banco no se usa: manda el banco.';
