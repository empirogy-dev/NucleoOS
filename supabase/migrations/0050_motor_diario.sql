-- ============================================================
-- NucleoOS · Migración 0050 — El motor diario de las metas
-- Un hábito puede apuntar a una meta SIN pisar su conexión: antes,
-- linkear un hábito sobreescribía la métrica de la meta (y adiós
-- libros elegidos). Ahora el vínculo vive en el hábito (meta_id):
-- la meta conserva su métrica de resultado, y las marcas del hábito
-- se vuelven su motor diario, rellenando visiblemente el tramo en
-- curso de la barra.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.habits
  add column if not exists meta_id uuid references public.objectives(id) on delete set null;
