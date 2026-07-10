-- ============================================================
-- NucleoOS · Migración 0017 — Visión como collage libre
-- Cada imagen o nota del tablero guarda su posición, tamaño,
-- rotación y capa, para armar un collage editable.
-- Requiere la 0016 (bucket "vision").
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.vision_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'imagen' check (kind in ('imagen', 'nota')),
  path text,
  content text,
  color text,
  x double precision not null default 60,
  y double precision not null default 60,
  w double precision not null default 240,
  h double precision not null default 180,
  rotation double precision not null default 0,
  z integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.vision_items enable row level security;

drop policy if exists "vision_items select" on public.vision_items;
drop policy if exists "vision_items insert" on public.vision_items;
drop policy if exists "vision_items update" on public.vision_items;
drop policy if exists "vision_items delete" on public.vision_items;

create policy "vision_items select" on public.vision_items
  for select using (user_id = auth.uid());
create policy "vision_items insert" on public.vision_items
  for insert with check (user_id = auth.uid());
create policy "vision_items update" on public.vision_items
  for update using (user_id = auth.uid());
create policy "vision_items delete" on public.vision_items
  for delete using (user_id = auth.uid());
