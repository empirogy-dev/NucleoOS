-- ============================================================
-- NucleoOS · Migración 0010 — Área de Relaciones
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

-- VÍNCULOS (las personas importantes de tu vida)
create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relation text,                   -- mamá, amiga, pareja, hermano...
  birthday date,
  contact_every_days int,          -- cada cuántos días te gustaría tener contacto
  notes text,
  created_at timestamptz not null default now()
);

-- INTERACCIONES (la línea de tiempo de cada vínculo)
create table if not exists public.relationship_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  date date not null default current_date,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_relationships_user on public.relationships(user_id);
create index if not exists idx_rel_logs_rel_date on public.relationship_logs(relationship_id, date desc);

alter table public.relationships enable row level security;
alter table public.relationship_logs enable row level security;

do $$
declare t text;
begin
  foreach t in array array['relationships','relationship_logs'] loop
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
