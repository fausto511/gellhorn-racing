-- RS-0027: live applied as version 20260926094920 (hub_events_hosts_rsvp).
-- RS-0027 (2026-09-26): Events nur durch Event Hosts, immer oeffentlich,
-- Teilnehmerlimit + Zusagen (DEC-0069).
--   * Crew Leader haben KEINE Event-Rechte mehr (Nutzer: "Crewleader ist
--     Crewleader, Event-Host ist Event-Host").
--   * Host darf als Veranstalter-Crew nur eine Crew angeben, in der er selbst
--     aktives Mitglied ist (oder keine).
--   * Events von Nicht-Moderatoren sind immer veroeffentlicht (Trigger);
--     Moderatoren koennen ein Event verstecken.
--   * max_participants optional; Zusagen in hub_event_rsvps (Absagen =
--     Zeile loeschen). Namen der Zusagenden sind oeffentlich (Nutzer),
--     anonymisierte Fahrer nur als Zahl.

-- ---- event policies -------------------------------------------------------
drop policy if exists hub_events_public_read on public.hub_events;
drop policy if exists hub_events_host_insert on public.hub_events;
drop policy if exists hub_events_host_update on public.hub_events;
drop policy if exists hub_events_host_delete on public.hub_events;

create or replace function public.is_active_member(target_crew uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.crew_memberships m
    join public.drivers d on d.driver_id = m.driver_id
    where d.auth_user_id = auth.uid() and m.crew_id = target_crew and m.status = 'active'
  );
$$;

create policy hub_events_public_read on public.hub_events
  for select using (is_published or public.is_moderator() or created_by = public.current_driver_id());
create policy hub_events_host_insert on public.hub_events
  for insert with check (
    created_by = public.current_driver_id() and public.is_event_host()
    and (host_crew_id is null or public.is_active_member(host_crew_id))
  );
create policy hub_events_host_update on public.hub_events
  for update using (created_by = public.current_driver_id() and public.is_event_host())
  with check (
    created_by = public.current_driver_id() and public.is_event_host()
    and (host_crew_id is null or public.is_active_member(host_crew_id))
  );
create policy hub_events_host_delete on public.hub_events
  for delete using (created_by = public.current_driver_id());

alter table public.hub_events
  add column max_participants integer check (max_participants is null or max_participants between 2 and 500);

create or replace function public.hub_events_force_public()
returns trigger language plpgsql set search_path = public as $$
begin
  if not public.is_moderator() then
    new.is_published := true;
    if tg_op = 'UPDATE' then new.created_by := old.created_by; end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.hub_events_force_public() from public;
create trigger hub_events_force_public
  before insert or update on public.hub_events
  for each row execute function public.hub_events_force_public();

-- ---- RSVPs ------------------------------------------------------------------
create table public.hub_event_rsvps (
  event_id   uuid not null references public.hub_events (event_id) on delete cascade,
  driver_id  uuid not null references public.drivers (driver_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, driver_id)
);
create index hub_event_rsvps_driver_idx on public.hub_event_rsvps (driver_id);
comment on table public.hub_event_rsvps is 'Event sign-ups (RS-0027). Row = going; cancelling = delete.';

-- Can still sign up: published, scheduled, not over, not full.
create or replace function public.hub_event_open_for_rsvp(p_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.hub_events e
    where e.event_id = p_event and e.is_published and e.status = 'scheduled'
      and coalesce(e.ends_at, e.starts_at + interval '3 hours') > now()
      and (e.max_participants is null
           or (select count(*) from public.hub_event_rsvps r where r.event_id = e.event_id) < e.max_participants)
  );
$$;

alter table public.hub_event_rsvps enable row level security;
create policy hub_event_rsvps_select on public.hub_event_rsvps
  for select using (driver_id = public.current_driver_id() or public.is_moderator());
create policy hub_event_rsvps_insert on public.hub_event_rsvps
  for insert with check (driver_id = public.current_driver_id() and public.hub_event_open_for_rsvp(event_id));
create policy hub_event_rsvps_delete on public.hub_event_rsvps
  for delete using (driver_id = public.current_driver_id() or public.is_moderator());
grant select, insert, delete on public.hub_event_rsvps to authenticated;

-- Public list: names of everyone going (anonymised / deleted drivers -> null,
-- shown only as a number). Owner-rights view like public_leaderboard.
create view public.public_event_rsvps as
  select r.event_id,
         case when d.hide_display_name or d.deleted_at is not null then null else d.display_name end as display_name,
         r.created_at
  from public.hub_event_rsvps r
  join public.hub_events e on e.event_id = r.event_id and e.is_published
  join public.drivers d on d.driver_id = r.driver_id;
grant select on public.public_event_rsvps to anon, authenticated;
