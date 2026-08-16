-- 0071: el auto y su bitácora de kilómetros.
--
-- Un auto comprado para trabajar no se deduce por lo que costó. Se deduce por
-- la parte de sus gastos que corresponde al uso de trabajo, y esa parte se
-- mide en kilómetros: los del negocio divididos por los del año. Sin bitácora
-- ese porcentaje no existe, y sin porcentaje la deducción no se sostiene
-- aunque los gastos estén perfectamente anotados.
--
-- Son tres tablas porque son tres cosas distintas:
--   * el auto, que se compra una vez
--   * las lecturas del odómetro, que dan los kilómetros TOTALES del año
--   * los viajes de trabajo, que dan los kilómetros DEL NEGOCIO
--
-- Los viajes personales no se anotan a propósito. Salen por resta, y pedir
-- que se anote cada ida al supermercado convierte la bitácora en algo que
-- nadie mantiene.

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  plate text,
  -- Cuándo y por cuánto se compró. No se deduce como gasto: va por
  -- depreciación, y eso lo decide un contador. Se guarda para tenerlo.
  purchase_date date,
  purchase_price numeric,
  currency text not null default 'CAD',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_odometer (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  date date not null,
  km numeric not null check (km >= 0),
  note text,
  created_at timestamptz not null default now(),
  unique (vehicle_id, date)
);

create table if not exists public.vehicle_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  date date not null,
  km numeric not null check (km > 0),
  -- A dónde fuiste y para qué. La ley pide las dos cosas, no solo el número.
  destination text,
  purpose text,
  created_at timestamptz not null default now()
);

alter table public.vehicles enable row level security;
alter table public.vehicle_odometer enable row level security;
alter table public.vehicle_trips enable row level security;

drop policy if exists "sus autos" on public.vehicles;
create policy "sus autos" on public.vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sus lecturas" on public.vehicle_odometer;
create policy "sus lecturas" on public.vehicle_odometer
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sus viajes" on public.vehicle_trips;
create policy "sus viajes" on public.vehicle_trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists ix_vehiculos_user on public.vehicles (user_id);
create index if not exists ix_odometro_auto on public.vehicle_odometer (vehicle_id, date);
create index if not exists ix_viajes_auto on public.vehicle_trips (vehicle_id, date);
