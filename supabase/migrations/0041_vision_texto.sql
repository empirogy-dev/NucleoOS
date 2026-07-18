-- ============================================================
-- NucleoOS · Migración 0041 — Texto con estilo en el Visual board
-- Las notas del collage ganan negrita y tamaño de letra propio,
-- y pueden ir sin fondo (texto suelto sobre el lienzo, el color
-- guarda 'none'). Requiere la 0017 y la 0039.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.vision_items
  add column if not exists bold boolean not null default false;

alter table public.vision_items
  add column if not exists font_size integer;
