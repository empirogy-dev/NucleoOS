-- ============================================================
-- NucleoOS · Migración 0055 — Check-ins de almuerzo y de noche
-- El coach acompaña todo el día, no solo en la mañana: pregunta por el
-- almuerzo y, en la noche, por la última comida (para el ayuno) y por
-- algo especial del día que quieras guardar en tu diario.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- ============================================================

-- Almuerzo
alter table public.wa_vinculos
  add column if not exists almuerzo_activo boolean not null default false;
alter table public.wa_vinculos
  add column if not exists almuerzo_hora text not null default '13:00';
alter table public.wa_vinculos
  add column if not exists almuerzo_ultimo date;

-- Noche (cierre del día: última comida + recuerdo del día)
alter table public.wa_vinculos
  add column if not exists noche_activo boolean not null default false;
alter table public.wa_vinculos
  add column if not exists noche_hora text not null default '21:00';
alter table public.wa_vinculos
  add column if not exists noche_ultimo date;
