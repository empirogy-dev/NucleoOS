-- ============================================================
-- NucleoOS · Migración 0037 — El lazo es mutuo
-- Cada vínculo puede tener su correo y su consentimiento: la otra
-- persona elige si quiere recibir recorditos para cuidar el lazo.
-- Ejecutar en: Supabase → SQL Editor → pegar → Run
-- Si después ves un error de esquema, corre también:
--   NOTIFY pgrst, 'reload schema';
-- ============================================================

alter table public.relationships
  add column if not exists email text;

alter table public.relationships
  add column if not exists reminders_status text not null default 'sin_invitar'
    check (reminders_status in ('sin_invitar', 'invitada', 'acepta', 'declina'));
