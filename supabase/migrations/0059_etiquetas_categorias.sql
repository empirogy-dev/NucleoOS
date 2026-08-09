-- 0059: las etiquetas también ordenan las categorías, o sea los presupuestos.
--
-- Hasta ahora las etiquetas colgaban solo de cada gasto, una por una. Pero lo
-- que separa la vida de verdad no es gasto por gasto: es que Comida y Arriendo
-- son personales y Bencina y Herramientas son de la empresa. Eso vive en la
-- categoría, que es donde vive el presupuesto.
--
-- Una categoría puede llevar VARIAS etiquetas a propósito: la bencina a veces
-- es personal y a veces es de la empresa, y obligarla a elegir una sola
-- llevaría a inventar categorías duplicadas ("Bencina personal", "Bencina
-- empresa"), que es justo el desorden que esto viene a evitar.

create table if not exists public.category_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (category_id, tag_id)
);

alter table public.category_tags enable row level security;
drop policy if exists "category_tags propios" on public.category_tags;
create policy "category_tags propios" on public.category_tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists ix_ctags_cat on public.category_tags (category_id);
create index if not exists ix_ctags_tag on public.category_tags (tag_id);
