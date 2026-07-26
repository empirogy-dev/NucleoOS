-- ============================================================
-- NucleoOS · Migración 0054 — Check-in de la mañana (coach proactivo)
-- El coach por Telegram pregunta solo a cierta hora (despertar, agua,
-- desayuno) para que un cerebro con TDAH no tenga que acordarse de registrar.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

alter table public.wa_vinculos
  add column if not exists checkin_activo boolean not null default false;

alter table public.wa_vinculos
  add column if not exists checkin_hora text not null default '08:00';

-- El día del último check-in enviado, para no preguntar dos veces.
alter table public.wa_vinculos
  add column if not exists checkin_ultimo date;
