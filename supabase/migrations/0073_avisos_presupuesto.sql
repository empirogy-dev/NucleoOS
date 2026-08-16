-- 0073: constancia de qué aviso de presupuesto ya se dio.
--
-- El tope ya se ve en la app, pero solo si uno entra a mirarlo, y un
-- presupuesto del que te enteras cuando ya lo pasaste no es un presupuesto,
-- es un informe. Así que el aviso se manda por el resumen de la mañana, que
-- es lo que ella sí lee todos los días.
--
-- Y por eso hace falta esta tabla: sin ella, el aviso se repetiría cada
-- mañana desde el día que cruzas el ochenta por ciento hasta fin de mes. Un
-- coach que repite lo mismo quince días seguidos es un coach que se silencia.
--
-- Una fila por categoría, mes y nivel. Dos niveles: cuando te acercas al tope
-- y cuando lo pasas, porque son dos noticias distintas y las dos valen una vez.

create table if not exists public.budget_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  -- El mes en formato AAAA-MM: los avisos se reinician solos cada mes,
  -- porque el presupuesto también.
  month text not null,
  level text not null check (level in ('cerca', 'pasado')),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month, level)
);

alter table public.budget_alerts enable row level security;

drop policy if exists "sus avisos" on public.budget_alerts;
create policy "sus avisos" on public.budget_alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists ix_avisos_mes on public.budget_alerts (user_id, month);
