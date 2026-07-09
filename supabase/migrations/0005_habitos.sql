-- ============================================================
-- NucleoOS · Migración 0005 — Área de Hábitos y Rutinas
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

-- HÁBITOS (lo que quieres cumplir cada día)
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  created_at timestamptz not null default now()
);

-- CUMPLIMIENTO DIARIO (un check por hábito y día)
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

-- RUTINA DE SUEÑO (una fila por día: a qué hora te acostaste y te levantaste)
create table if not exists public.routine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  wake_time time,
  bed_time time,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- EJERCICIO (caminata, yoga, gimnasio... con minutos)
create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  kind text not null,
  minutes int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_habit_logs_habit_date on public.habit_logs(habit_id, date desc);
create index if not exists idx_routine_user_date on public.routine_logs(user_id, date desc);
create index if not exists idx_exercise_user_date on public.exercise_logs(user_id, date desc);

alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.routine_logs enable row level security;
alter table public.exercise_logs enable row level security;

do $$
declare t text;
begin
  foreach t in array array['habits','habit_logs','routine_logs','exercise_logs'] loop
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
