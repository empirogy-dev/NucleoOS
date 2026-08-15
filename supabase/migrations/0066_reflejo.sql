-- 0066: los dos lados de una transferencia, enlazados.
--
-- Cuando ella paga la tarjeta desde su cuenta corriente, el banco publica DOS
-- movimientos: uno que sale de Chequing y otro que llega a Capital One. Son
-- las dos caras de un mismo traspaso, y así es como se ven en las cartolas de
-- cada cuenta.
--
-- Borrar uno hacía que la app dejara de parecerse a lo que dice el banco.
-- Dejar los dos sueltos hacía que todo se contara doble. La salida es
-- enlazarlos: los dos se ven, y la app sabe que son el mismo movimiento.
--
-- El que lleva la marca es EL REFLEJO: se muestra, pero no suma. El que manda
-- es el que sale de la cuenta que paga, porque es el único que sabe de dónde
-- salió la plata y a dónde llegó.

alter table public.transactions
  add column if not exists mirror_of uuid references public.transactions (id) on delete set null;

comment on column public.transactions.mirror_of is
  'El otro lado de este mismo traspaso. Si está lleno, esta fila es el reflejo: se muestra pero no cuenta en saldos ni en reportes.';

create index if not exists ix_tx_mirror
  on public.transactions (user_id) where mirror_of is not null;
