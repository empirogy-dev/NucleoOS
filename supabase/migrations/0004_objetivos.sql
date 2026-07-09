-- ============================================================
-- NucleoOS · Migración 0004 — Área de Objetivos + registro de avances
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

-- METAS (objetivos por área)
create table if not exists public.objectives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  area text,                                   -- clave de área (finanzas, salud, trabajo...) o null si es general
  status text not null default 'en_camino',    -- en_camino | en_riesgo | lograda | pausada
  progress int not null default 0,             -- 0 a 100 (manual; si hay milestones se calcula con ellos)
  deadline date,
  created_at timestamptz not null default now()
);

-- MILESTONES (pasos de una meta)
create table if not exists public.objective_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  objective_id uuid not null references public.objectives(id) on delete cascade,
  title text not null,
  progress int not null default 0,             -- 0 a 100
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- REGISTRO DE AVANCES (transversal: alimenta "Actividad reciente" de todas las áreas)
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area text not null default 'objetivos',
  date date not null default current_date,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_objectives_user on public.objectives(user_id);
create index if not exists idx_milestones_objective on public.objective_milestones(objective_id);
create index if not exists idx_activity_user_date on public.activity_log(user_id, date desc);

alter table public.objectives enable row level security;
alter table public.objective_milestones enable row level security;
alter table public.activity_log enable row level security;

do $$
declare t text;
begin
  foreach t in array array['objectives','objective_milestones','activity_log'] loop
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
