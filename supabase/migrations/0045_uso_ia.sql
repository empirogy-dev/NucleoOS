-- ============================================================
-- NucleoOS · Migración 0045 — Contador de uso diario de la IA
-- La Edge Function "ia" anota cuántas llamadas hace cada usuaria al
-- día y corta al llegar al tope: nadie puede usar tu llave de Gemini
-- como asistente ilimitado. La tabla NO tiene políticas de acceso:
-- solo el servidor (service role) puede leerla y escribirla, así un
-- usuario no puede resetear su propio contador.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

create table if not exists public.ia_uso (
  user_id uuid not null references auth.users(id) on delete cascade,
  dia date not null,
  usos integer not null default 0,
  primary key (user_id, dia)
);

alter table public.ia_uso enable row level security;
-- Sin políticas a propósito: solo el service role del servidor entra.
