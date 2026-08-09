-- 0058: conexión bancaria en vivo (Plaid).
-- La idea: el banco empuja las transacciones solo, y la cartola queda como
-- respaldo para los bancos que no estén cubiertos.

-- ---------- La conexión con el banco ----------
-- OJO CON LA SEGURIDAD: esta tabla guarda el access_token del banco, que es
-- una credencial. Lleva RLS activo y A PROPÓSITO NINGUNA POLÍTICA: así el
-- navegador (llave publishable) no puede leerla ni escribirla NUNCA, y solo
-- las Edge Functions, que usan la llave de servicio, la tocan.
create table if not exists public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'plaid',
  item_id text not null,
  access_token text not null,
  institution_name text,
  -- El cursor de Plaid: desde dónde seguir la próxima vez. Así cada sync
  -- trae solo lo nuevo, sin volver a pedir la historia entera.
  cursor text,
  status text not null default 'activo' check (status in ('activo', 'revisar', 'desconectado')),
  last_sync timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);
alter table public.bank_connections enable row level security;

-- ---------- Identidad externa, para no duplicar nada ----------
-- Plaid da un id único por transacción y por cuenta: con eso el dedupe es
-- exacto, mucho mejor que nuestra firma de fecha, monto y texto.
alter table public.transactions add column if not exists external_id text;
create unique index if not exists ux_tx_external
  on public.transactions (user_id, external_id) where external_id is not null;

alter table public.accounts add column if not exists external_id text;
create unique index if not exists ux_acc_external
  on public.accounts (user_id, external_id) where external_id is not null;

alter table public.credit_cards add column if not exists external_id text;
create unique index if not exists ux_card_external
  on public.credit_cards (user_id, external_id) where external_id is not null;

-- La cuenta ya tenía is_connected: ahora significa "la mantiene el banco".
comment on column public.accounts.is_connected is
  'true = la cuenta viene del banco por Plaid y su saldo lo manda el banco';
