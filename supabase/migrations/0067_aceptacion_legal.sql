-- 0067: constancia de que la persona aceptó los términos y la privacidad.
--
-- Una casilla marcada en pantalla no vale nada si no queda registrada: hay
-- que poder demostrar QUÉ versión aceptó y CUÁNDO. Si el documento cambia,
-- sube la versión y se vuelve a pedir; las aceptaciones anteriores se
-- conservan, porque son el historial.
--
-- No se guarda la dirección IP a propósito. Para lo que necesitamos, la fecha
-- y la versión bastan, y una IP es un dato personal más que habría que
-- explicar, proteger y borrar.

create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, version)
);

alter table public.legal_acceptances enable row level security;

-- Cada quien ve y crea solo las suyas. Nadie puede borrarlas ni cambiarlas:
-- una constancia que se puede editar deja de ser una constancia.
drop policy if exists "acepta lo suyo" on public.legal_acceptances;
create policy "acepta lo suyo" on public.legal_acceptances
  for select using (auth.uid() = user_id);

drop policy if exists "registra lo suyo" on public.legal_acceptances;
create policy "registra lo suyo" on public.legal_acceptances
  for insert with check (auth.uid() = user_id);

create index if not exists ix_legal_user on public.legal_acceptances (user_id);
