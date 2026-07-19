-- ============================================================
-- NucleoOS · Migración 0048 — Vía Psicología en la Biblioteca
-- La biblioteca curada suma la vía "psicologia" (9 clásicos), y tus
-- libros propios también pueden usarla: el check de user_books se
-- amplía para incluirla.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.user_books
  drop constraint if exists user_books_via_check;

alter table public.user_books
  add constraint user_books_via_check
  check (via in ('tdah', 'habitos', 'emociones', 'psicologia', 'relaciones', 'finanzas', 'proposito', 'espiritualidad'));
