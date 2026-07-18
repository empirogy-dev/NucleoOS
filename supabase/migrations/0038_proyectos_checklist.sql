-- ============================================================
-- NucleoOS · Migración 0038 — Checklist de proyectos y metas por horas
-- 1) Cada proyecto de Trabajo puede tener su checklist: los pasos
--    marcados calculan solos el porcentaje de avance.
-- 2) Nueva métrica 'trabajo_horas': una meta puede alimentarse de las
--    horas de jornada dedicadas a un proyecto (estudiar, la empresa).
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.project_tasks enable row level security;

drop policy if exists "ptasks select" on public.project_tasks;
drop policy if exists "ptasks insert" on public.project_tasks;
drop policy if exists "ptasks update" on public.project_tasks;
drop policy if exists "ptasks delete" on public.project_tasks;

create policy "ptasks select" on public.project_tasks
  for select using (user_id = auth.uid());
create policy "ptasks insert" on public.project_tasks
  for insert with check (user_id = auth.uid());
create policy "ptasks update" on public.project_tasks
  for update using (user_id = auth.uid());
create policy "ptasks delete" on public.project_tasks
  for delete using (user_id = auth.uid());

-- Métrica nueva para las metas automáticas
alter table public.objectives
  drop constraint if exists objectives_auto_metric_check;

alter table public.objectives
  add constraint objectives_auto_metric_check
  check (auto_metric in ('mov_sesiones', 'mov_minutos', 'mente_sesiones', 'habito_marcas', 'reto_dias', 'area_avances', 'trabajo_horas'));
