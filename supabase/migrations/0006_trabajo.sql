-- ============================================================
-- NucleoOS · Migración 0006 — Área de Trabajo y Proyectos
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

-- PROYECTOS PERSONALES (lo que quieres desarrollar)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'activo',      -- idea | activo | pausado | terminado
  progress int not null default 0,            -- 0 a 100
  description text,
  created_at timestamptz not null default now()
);

-- REGISTRO DE TRABAJO (jornada del empleo o avance en un proyecto)
create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  kind text not null default 'empleo',        -- empleo | proyecto
  project_id uuid references public.projects(id) on delete set null,
  description text not null default '',
  hours numeric,                              -- horas dedicadas
  mood int,                                   -- 1 a 5, cómo te sentiste (solo empleo)
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_user on public.projects(user_id);
create index if not exists idx_work_logs_user_date on public.work_logs(user_id, date desc);
create index if not exists idx_work_logs_project on public.work_logs(project_id);

alter table public.projects enable row level security;
alter table public.work_logs enable row level security;

do $$
declare t text;
begin
  foreach t in array array['projects','work_logs'] loop
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
