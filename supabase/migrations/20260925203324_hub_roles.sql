-- RS-0023: live applied as version 20260925203324 (hub_roles).
-- RS-0023 (2026-09-26): Rollen fuer The Hub -- Crew Leader + Event Host.
-- Vergabe nur durch Moderatoren (kein oeffentlicher Antrag, DEC-0056 Pkt. 10
-- / Plattformkonzept Abschnitt 10). Rechte:
--   crew_leader (immer an genau eine Crew gebunden):
--     * sieht und bearbeitet seine Crew (auch als Entwurf),
--     * darf NICHT: slug, is_partner, is_published, sort_order aendern
--       (Trigger crews_protect_moderated_fields),
--     * darf Events fuer seine Crew anlegen/bearbeiten/loeschen.
--   event_host (global):
--     * legt eigene Events an (Veranstalter frei oder eine Crew, die er
--       selbst leitet), bearbeitet/loescht nur eigene Events,
--     * Events gehen direkt live (Hosts sind handverlesen; Moderatoren
--       koennen jederzeit auf Draft setzen oder loeschen).

create table public.hub_roles (
  role_id     uuid primary key default gen_random_uuid(),
  driver_id   uuid not null references public.drivers (driver_id) on delete cascade,
  role        text not null check (role in ('crew_leader','event_host')),
  crew_id     uuid references public.crews (crew_id) on delete cascade,
  granted_by  uuid references public.drivers (driver_id) on delete set null,
  granted_at  timestamptz not null default now(),
  constraint hub_roles_crew_matches_role check ((role = 'crew_leader') = (crew_id is not null))
);
create unique index hub_roles_unique_idx on public.hub_roles (driver_id, role, coalesce(crew_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index hub_roles_crew_idx on public.hub_roles (crew_id);
create index hub_roles_granted_by_idx on public.hub_roles (granted_by);

comment on table public.hub_roles is
  'The Hub roles (RS-0023): crew_leader (per crew) and event_host. Granted/revoked by moderators only.';

create or replace function public.is_crew_leader(target_crew uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.hub_roles r
    join public.drivers d on d.driver_id = r.driver_id
    where d.auth_user_id = auth.uid() and r.role = 'crew_leader' and r.crew_id = target_crew
  );
$$;

create or replace function public.is_event_host()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.hub_roles r
    join public.drivers d on d.driver_id = r.driver_id
    where d.auth_user_id = auth.uid() and r.role = 'event_host'
  );
$$;

alter table public.hub_roles enable row level security;
create policy hub_roles_select_own_or_moderator on public.hub_roles
  for select using (driver_id = public.current_driver_id() or public.is_moderator());
create policy hub_roles_moderator_insert on public.hub_roles
  for insert with check (public.is_moderator());
create policy hub_roles_moderator_delete on public.hub_roles
  for delete using (public.is_moderator());
grant select, insert, delete on public.hub_roles to authenticated;

-- ---- crews: leaders see + edit their own crew ---------------------------
drop policy crews_public_read on public.crews;
create policy crews_public_read on public.crews
  for select using (is_published or public.is_moderator() or public.is_crew_leader(crew_id));
create policy crews_leader_update on public.crews
  for update using (public.is_crew_leader(crew_id)) with check (public.is_crew_leader(crew_id));

create or replace function public.crews_protect_moderated_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if not public.is_moderator() and (
       new.slug is distinct from old.slug
    or new.is_partner is distinct from old.is_partner
    or new.is_published is distinct from old.is_published
    or new.sort_order is distinct from old.sort_order) then
    raise exception 'Only moderators can change slug, partner status, publication and sort order'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.crews_protect_moderated_fields() from public;
create trigger crews_protect_moderated_fields
  before update on public.crews
  for each row execute function public.crews_protect_moderated_fields();

-- ---- hub_events: hosts + leaders manage their own events -----------------
drop policy hub_events_public_read on public.hub_events;
create policy hub_events_public_read on public.hub_events
  for select using (
    is_published or public.is_moderator()
    or created_by = public.current_driver_id()
    or (host_crew_id is not null and public.is_crew_leader(host_crew_id))
  );
create policy hub_events_host_insert on public.hub_events
  for insert with check (
    created_by = public.current_driver_id()
    and (
      (public.is_event_host() and (host_crew_id is null or public.is_crew_leader(host_crew_id)))
      or (host_crew_id is not null and public.is_crew_leader(host_crew_id))
    )
  );
create policy hub_events_host_update on public.hub_events
  for update using (
    created_by = public.current_driver_id()
    or (host_crew_id is not null and public.is_crew_leader(host_crew_id))
  ) with check (
    (host_crew_id is null and public.is_event_host() and created_by = public.current_driver_id())
    or (host_crew_id is not null and public.is_crew_leader(host_crew_id))
  );
create policy hub_events_host_delete on public.hub_events
  for delete using (
    created_by = public.current_driver_id()
    or (host_crew_id is not null and public.is_crew_leader(host_crew_id))
  );
