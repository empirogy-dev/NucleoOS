-- 0072: distinguir los viajes de trabajo de los personales.
--
-- La bitácora a mano solo registra los de trabajo, y eso está bien: pedir que
-- se anote cada ida al supermercado es la forma segura de que la bitácora se
-- abandone. Los personales salen por resta del odómetro.
--
-- Pero cuando los viajes vienen importados de una app que rastrea el auto
-- sola, los personales llegan gratis y ya clasificados. Guardarlos es
-- estrictamente mejor: los kilómetros totales del año salen del propio
-- registro y ya no dependen de acordarse de mirar el tablero en enero.
--
-- Por defecto verdadero, que es lo que son todos los que ya estaban.

alter table public.vehicle_trips
  add column if not exists is_business boolean not null default true;

comment on column public.vehicle_trips.is_business is
  'Viaje de trabajo. Los falsos solo existen para calcular los kilómetros totales.';

create index if not exists ix_viajes_negocio on public.vehicle_trips (vehicle_id, is_business);
