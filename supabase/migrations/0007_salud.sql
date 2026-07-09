-- ============================================================
-- NucleoOS · Migración 0007 — Área de Salud
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

-- FICHA DE SALUD (datos base: una fila por usuario)
create table if not exists public.health_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  blood_type text,
  allergies text,
  conditions text,
  surgeries text,
  notes text,
  updated_at timestamptz not null default now()
);

-- MEDICAMENTOS
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dose text,
  schedule text,                 -- por ejemplo: "08:00 y 20:00, con comida"
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- CITAS (psicólogo, médico, dentista...)
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  time time,
  location text,
  notes text,
  created_at timestamptz not null default now()
);

-- EXÁMENES (de sangre, vitaminas, chequeos) con fecha de vencimiento y resultado
create table if not exists public.health_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  due_date date,
  result text,
  notes text,
  created_at timestamptz not null default now()
);

-- SOBRIEDAD (dejar una adicción: sustancia y fecha de inicio)
create table if not exists public.sobriety (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  substance text not null,
  start_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_medications_user on public.medications(user_id);
create index if not exists idx_appointments_user_date on public.appointments(user_id, date);
create index if not exists idx_exams_user on public.health_exams(user_id);
create index if not exists idx_sobriety_user on public.sobriety(user_id);

alter table public.health_profile enable row level security;
alter table public.medications enable row level security;
alter table public.appointments enable row level security;
alter table public.health_exams enable row level security;
alter table public.sobriety enable row level security;

do $$
declare t text;
begin
  foreach t in array array['health_profile','medications','appointments','health_exams','sobriety'] loop
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
