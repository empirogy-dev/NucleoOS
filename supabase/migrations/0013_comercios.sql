-- ============================================================
-- NucleoOS · Migración 0013 — Comercios y reglas de renombrado
-- Cada movimiento puede tener el nombre del comercio (a quién se
-- le pagó), y las reglas aprenden: al renombrar una boleta del
-- banco, las próximas llegan con ese nombre y categoría.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.transactions
  add column if not exists merchant text;

create table if not exists public.merchant_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern text not null,                 -- texto normalizado del banco (ej: "klarna spike sex")
  merchant text not null,                -- nombre que quiere la usuaria (ej: "Spice Sex")
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, pattern)
);

alter table public.merchant_rules enable row level security;

drop policy if exists "own rows select" on public.merchant_rules;
drop policy if exists "own rows insert" on public.merchant_rules;
drop policy if exists "own rows update" on public.merchant_rules;
drop policy if exists "own rows delete" on public.merchant_rules;
create policy "own rows select" on public.merchant_rules for select using (auth.uid() = user_id);
create policy "own rows insert" on public.merchant_rules for insert with check (auth.uid() = user_id);
create policy "own rows update" on public.merchant_rules for update using (auth.uid() = user_id);
create policy "own rows delete" on public.merchant_rules for delete using (auth.uid() = user_id);
