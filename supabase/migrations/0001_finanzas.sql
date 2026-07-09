-- ============================================================
-- NucleoOS · Migración 0001 — Área de Finanzas (base Fluxney)
-- Todas las tablas: user_id + Row Level Security (RLS).
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

-- CUENTAS
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank_name text,
  account_type text not null default 'Checking', -- Checking | Savings | Credit Card | Investment | Cash
  balance numeric not null default 0,
  currency text not null default 'CLP',
  is_connected boolean not null default false,
  created_at timestamptz not null default now()
);

-- CATEGORÍAS
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'expense',          -- income | expense | savings
  budget numeric,
  budget_mode text,                              -- fixed | flexible | variable
  icon text,
  color text,
  created_at timestamptz not null default now()
);

-- TRANSACCIONES (con `source`: la capa de adaptadores)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  amount numeric not null,
  type text not null default 'expense',          -- income | expense | transfer
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  destination_account_id uuid references public.accounts(id) on delete set null,
  source text not null default 'manual',        -- manual | voz | recibo | cartola | banco
  created_at timestamptz not null default now()
);

-- METAS DE AHORRO
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null default 0,
  current_amount numeric not null default 0,
  deadline date,
  icon text,
  color text,
  created_at timestamptz not null default now()
);

-- DEUDAS
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  institution text,
  debt_type text,
  balance numeric not null default 0,
  interest_rate numeric default 0,
  min_payment numeric default 0,
  due_date date,
  currency text not null default 'CLP',
  notes text,
  created_at timestamptz not null default now()
);

-- TARJETAS DE CRÉDITO
create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank text,
  last_four text,
  credit_limit numeric default 0,
  balance numeric not null default 0,
  min_payment numeric default 0,
  due_date date,
  apr numeric default 0,
  currency text not null default 'CLP',
  created_at timestamptz not null default now()
);

-- RECORDATORIOS DE PAGO
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric,
  date date not null,
  recurrence text not null default 'oneTime',    -- oneTime | monthly | biweekly
  category text not null default 'custom',       -- custom | debt | creditCard
  notes text,
  source_id uuid,
  created_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_accounts_user on public.accounts(user_id);
create index if not exists idx_categories_user on public.categories(user_id);

-- ============================================================
-- ROW LEVEL SECURITY: cada usuario ve/edita SOLO lo suyo
-- ============================================================
alter table public.accounts     enable row level security;
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;
alter table public.goals        enable row level security;
alter table public.debts        enable row level security;
alter table public.credit_cards enable row level security;
alter table public.reminders    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['accounts','categories','transactions','goals','debts','credit_cards','reminders'] loop
    execute format('drop policy if exists "own rows select" on public.%I', t);
    execute format('drop policy if exists "own rows insert" on public.%I', t);
    execute format('drop policy if exists "own rows update" on public.%I', t);
    execute format('drop policy if exists "own rows delete" on public.%I', t);
    execute format('create policy "own rows select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "own rows insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "own rows update" on public.%I for update using (auth.uid() = user_id)', t);
    execute format('create policy "own rows delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;
