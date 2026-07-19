-- ============================================================
-- NucleoOS · Migración 0052 — Recordatorios con hora
--
-- "Recuérdame tomar mis suplementos a las 2" y el bot te escribe a las 2.
-- Pueden ser de todos los días o de una sola vez.
--
-- No hay nada que cambiar aquí: pega y Run.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.wa_recordatorios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  texto text not null,                       -- "tomar mis suplementos"
  hora text not null,                        -- "14:00", en la zona de la usuaria
  repite text not null default 'diario'
    check (repite in ('diario', 'unico')),
  fecha date,                                -- solo si repite = 'unico'
  activo boolean not null default true,
  ultimo_envio date,                         -- memoria: no avisar dos veces el mismo día
  creado_en timestamptz not null default now()
);

create index if not exists ix_wa_recordatorios_usuario
  on public.wa_recordatorios (user_id) where activo;

alter table public.wa_recordatorios enable row level security;

-- La usuaria ve y administra los suyos desde la app; el bot escribe con el
-- service role del servidor.
create policy wa_recordatorios_ver on public.wa_recordatorios
  for select using (auth.uid() = user_id);
create policy wa_recordatorios_crear on public.wa_recordatorios
  for insert with check (auth.uid() = user_id);
create policy wa_recordatorios_editar on public.wa_recordatorios
  for update using (auth.uid() = user_id);
create policy wa_recordatorios_borrar on public.wa_recordatorios
  for delete using (auth.uid() = user_id);
