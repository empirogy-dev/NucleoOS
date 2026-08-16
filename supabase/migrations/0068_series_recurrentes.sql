-- 0068: lo que la persona decidió sobre cada serie de cargos que se repite.
--
-- Las suscripciones NO se guardan aquí. Se encuentran solas mirando los
-- movimientos, y por eso no se desactualizan cuando suben el precio o cuando
-- una se cancela. Una lista de suscripciones escrita a mano miente a los tres
-- meses; los cargos del banco no mienten.
--
-- Lo único que esta tabla guarda es lo que la app NO puede deducir sola:
--   * que esa serie es en realidad una compra en cuotas, y cuántas son
--   * que no es una suscripción y hay que dejar de mostrarla
--   * cómo se llama de verdad, cuando la glosa del banco es ilegible
--
-- La serie se reconoce por dos amarres a la vez: la clave del comercio y el
-- movimiento más antiguo. Con uno solo no basta: la clave cambia si suben el
-- precio, y el ancla cambia si después se importan cargos más viejos. Con los
-- dos, la decisión sobrevive a las dos cosas.

create table if not exists public.recurring_series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  clave text not null,
  anchor_tx_id uuid references public.transactions (id) on delete set null,
  kind text not null default 'subscription'
    check (kind in ('subscription', 'installments', 'ignored')),
  name text,
  -- Cuántas cuotas son en total. Solo tiene sentido con kind = installments,
  -- y ahí es obligatorio: "van 4 de ?" no le sirve a nadie.
  installments_total integer check (installments_total is null or installments_total between 2 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, clave)
);

alter table public.recurring_series enable row level security;

drop policy if exists "sus series" on public.recurring_series;
create policy "sus series" on public.recurring_series
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists ix_recurring_user on public.recurring_series (user_id);
create index if not exists ix_recurring_ancla on public.recurring_series (anchor_tx_id);
