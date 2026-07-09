-- ============================================================
-- NucleoOS · Migración 0008 — Área de Aprendizaje
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

-- CUADERNOS
create table if not exists public.notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  created_at timestamptz not null default now()
);

-- NOTAS (entradas de un cuaderno)
create table if not exists public.notebook_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notebook_id uuid not null references public.notebooks(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notebooks_user on public.notebooks(user_id);
create index if not exists idx_entries_notebook on public.notebook_entries(notebook_id);

alter table public.notebooks enable row level security;
alter table public.notebook_entries enable row level security;

do $$
declare t text;
begin
  foreach t in array array['notebooks','notebook_entries'] loop
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
