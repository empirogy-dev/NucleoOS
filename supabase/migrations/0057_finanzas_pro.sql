-- 0057: Finanzas nivel contable.
-- Tres piezas: etiquetas para separar gastos (impuestos, negocio, personal),
-- pagar con tarjeta de crédito como fuente, y el archivo de cartolas por
-- cuenta y mes. Nada de lo existente cambia, solo se extiende.

-- ---------- 1. Etiquetas (N a M con transacciones) ----------
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
alter table public.tags enable row level security;
drop policy if exists "tags propios" on public.tags;
create policy "tags propios" on public.tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.transaction_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (transaction_id, tag_id)
);
alter table public.transaction_tags enable row level security;
drop policy if exists "transaction_tags propios" on public.transaction_tags;
create policy "transaction_tags propios" on public.transaction_tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists ix_ttags_tx on public.transaction_tags (transaction_id);
create index if not exists ix_ttags_tag on public.transaction_tags (tag_id);

-- ---------- 2. Fuente de pago unificada ----------
-- Un gasto puede salir de una cuenta o de una tarjeta de crédito.
-- account_id se mantiene por compatibilidad (cuando la fuente es cuenta,
-- se siguen escribiendo los dos).
alter table public.transactions
  add column if not exists payment_source_type text
    check (payment_source_type in ('account', 'credit_card')),
  add column if not exists payment_source_id uuid;
create index if not exists ix_tx_payment_source
  on public.transactions (payment_source_id) where payment_source_id is not null;

-- ---------- 3. Archivo de cartolas ----------
create table if not exists public.statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  credit_card_id uuid references public.credit_cards (id) on delete set null,
  period_month text not null check (period_month ~ '^\d{4}-\d{2}$'),
  file_path text,
  file_name text,
  status text not null default 'processed'
    check (status in ('pending', 'processing', 'processed', 'error')),
  transactions_count int not null default 0,
  created_at timestamptz not null default now(),
  -- la cartola pertenece a una cuenta O a una tarjeta, nunca a ambas
  check (account_id is null or credit_card_id is null)
);
alter table public.statements enable row level security;
drop policy if exists "statements propios" on public.statements;
create policy "statements propios" on public.statements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists ix_statements_user_mes on public.statements (user_id, period_month);

-- El archivo original de la cartola, privado y por carpeta de cada usuaria,
-- misma convención que recibos, salud y visión.
insert into storage.buckets (id, name, public)
values ('cartolas', 'cartolas', false)
on conflict (id) do nothing;

drop policy if exists "cartolas select" on storage.objects;
drop policy if exists "cartolas insert" on storage.objects;
drop policy if exists "cartolas update" on storage.objects;
drop policy if exists "cartolas delete" on storage.objects;
create policy "cartolas select" on storage.objects
  for select using (bucket_id = 'cartolas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cartolas insert" on storage.objects
  for insert with check (bucket_id = 'cartolas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cartolas update" on storage.objects
  for update using (bucket_id = 'cartolas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cartolas delete" on storage.objects
  for delete using (bucket_id = 'cartolas' and (storage.foldername(name))[1] = auth.uid()::text);
