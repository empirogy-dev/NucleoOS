-- ============================================================
-- NucleoOS · Migración 0042 — Tus propios libros en la Biblioteca
-- Además de la biblioteca curada, puedes agregar los libros que tú
-- quieras, con su vía, y la IA completa la ficha: por qué leerlo,
-- cómo toca las áreas de tu vida y sus tres ideas para llevar.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  author text not null default '',
  via text not null default 'proposito'
    check (via in ('tdah', 'habitos', 'emociones', 'relaciones', 'finanzas', 'proposito', 'espiritualidad')),
  emoji text not null default '📕',
  why text not null default '',
  ideas jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_books enable row level security;

drop policy if exists "user_books select" on public.user_books;
drop policy if exists "user_books insert" on public.user_books;
drop policy if exists "user_books update" on public.user_books;
drop policy if exists "user_books delete" on public.user_books;

create policy "user_books select" on public.user_books
  for select using (user_id = auth.uid());
create policy "user_books insert" on public.user_books
  for insert with check (user_id = auth.uid());
create policy "user_books update" on public.user_books
  for update using (user_id = auth.uid());
create policy "user_books delete" on public.user_books
  for delete using (user_id = auth.uid());
