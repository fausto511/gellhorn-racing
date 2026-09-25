-- RS-0024: live applied as migration crew_memberships.
-- RS-0024 (2026-09-26): Crew-Mitgliedschaften in The Hub (DEC-0066).
--   * Genau EINE Mitgliedschaft (angefragt ODER aktiv) pro Fahrer.
--   * Fahrer fragt bei einer veroeffentlichten Crew an; Crew Leader (oder
--     Moderator) nimmt an oder lehnt ab (= Zeile loeschen). Fahrer kann
--     Anfrage zurueckziehen / Crew verlassen (= Zeile loeschen); Leader und
--     Moderator koennen Mitglieder entfernen.
--   * Oeffentlich sichtbar ueber die View public_crew_roster: nur aktive
--     Mitglieder veroeffentlichter Crews, NICHT anonymisierte/geloeschte
--     Fahrer (DEC-0061). Daraus kommen Mitgliederliste und Crew-Tag im
--     Leaderboard.
--   * Wird jemand Crew Leader, bekommt er automatisch die aktive
--     Mitgliedschaft in seiner Crew (eine offene Anfrage woanders wird dabei
--     ersetzt; eine aktive Mitgliedschaft in einer ANDEREN Crew bleibt
--     unangetastet).
-- Zusaetzlich Fix: public_drivers zeigte bei anonymisierten Fahrern den
-- echten Namen (anon-lesbar, per driver_id mit public_leaderboard
-- verknuepfbar) -- widersprach DEC-0061.

create table public.crew_memberships (
  membership_id uuid primary key default gen_random_uuid(),
  crew_id       uuid not null references public.crews (crew_id) on delete cascade,
  driver_id     uuid not null references public.drivers (driver_id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending','active')),
  requested_at  timestamptz not null default now(),
  decided_at    timestamptz,
  decided_by    uuid references public.drivers (driver_id) on delete set null
);
create unique index crew_memberships_one_per_driver on public.crew_memberships (driver_id);
create index crew_memberships_crew_idx on public.crew_memberships (crew_id);
create index crew_memberships_decided_by_idx on public.crew_memberships (decided_by);
comment on table public.crew_memberships is
  'The Hub crew memberships (RS-0024): one row per driver, pending or active. Decline/leave/remove = delete.';

alter table public.crew_memberships enable row level security;

create policy crew_memberships_select on public.crew_memberships
  for select using (
    driver_id = public.current_driver_id()
    or public.is_crew_leader(crew_id)
    or public.is_moderator()
  );
-- Only the driver himself can ask, only as 'pending', only for a published crew.
create policy crew_memberships_request on public.crew_memberships
  for insert with check (
    driver_id = public.current_driver_id()
    and status = 'pending'
    and decided_at is null and decided_by is null
    and exists (select 1 from public.crews c where c.crew_id = crew_memberships.crew_id and c.is_published)
  );
-- Approving is the only update: leader of that crew or moderator.
create policy crew_memberships_decide on public.crew_memberships
  for update using (public.is_crew_leader(crew_id) or public.is_moderator())
  with check (public.is_crew_leader(crew_id) or public.is_moderator());
create policy crew_memberships_delete on public.crew_memberships
  for delete using (
    driver_id = public.current_driver_id()
    or public.is_crew_leader(crew_id)
    or public.is_moderator()
  );
grant select, insert, update, delete on public.crew_memberships to authenticated;

create or replace function public.crew_memberships_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  -- Called from hub_roles_leader_membership (new leader): trusted path.
  if pg_trigger_depth() > 1 then return new; end if;
  if new.crew_id is distinct from old.crew_id or new.driver_id is distinct from old.driver_id
     or new.requested_at is distinct from old.requested_at then
    raise exception 'Membership crew/driver cannot be changed' using errcode = '42501';
  end if;
  if new.status is distinct from old.status then
    new.decided_at := now();
    new.decided_by := public.current_driver_id();
  else
    new.decided_at := old.decided_at;
    new.decided_by := old.decided_by;
  end if;
  return new;
end;
$$;
revoke execute on function public.crew_memberships_guard() from public;
create trigger crew_memberships_guard
  before update on public.crew_memberships
  for each row execute function public.crew_memberships_guard();

-- New crew leader => active member of his crew.
create or replace function public.hub_roles_leader_membership()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'crew_leader' then
    insert into public.crew_memberships (crew_id, driver_id, status, decided_at, decided_by)
    values (new.crew_id, new.driver_id, 'active', now(), new.granted_by)
    on conflict (driver_id) do update
      set crew_id = excluded.crew_id, status = 'active',
          decided_at = excluded.decided_at, decided_by = excluded.decided_by
      where public.crew_memberships.status = 'pending'
         or public.crew_memberships.crew_id = excluded.crew_id;
  end if;
  return new;
end;
$$;
revoke execute on function public.hub_roles_leader_membership() from public, anon, authenticated;
create trigger hub_roles_leader_membership
  after insert on public.hub_roles
  for each row execute function public.hub_roles_leader_membership();

-- Public roster: active members of published crews, never anonymised or
-- deleted drivers. Owner-rights view like public_leaderboard.
create view public.public_crew_roster as
  select m.crew_id, c.tag, c.color, m.driver_id, d.display_name, m.decided_at as joined_at
  from public.crew_memberships m
  join public.crews c on c.crew_id = m.crew_id
  join public.drivers d on d.driver_id = m.driver_id
  where m.status = 'active' and c.is_published
    and d.deleted_at is null and not coalesce(d.hide_display_name, false);
grant select on public.public_crew_roster to anon, authenticated;

-- Management view (Hub Content + own status): requester names are needed
-- by the leader to decide, drivers table itself is self/moderator only.
create view public.crew_membership_overview as
  select m.membership_id, m.crew_id, c.name as crew_name, c.tag, c.color, c.slug,
         m.driver_id, d.display_name, m.status, m.requested_at, m.decided_at
  from public.crew_memberships m
  join public.crews c on c.crew_id = m.crew_id
  join public.drivers d on d.driver_id = m.driver_id
  where d.deleted_at is null
    and (m.driver_id = public.current_driver_id()
         or public.is_crew_leader(m.crew_id)
         or public.is_moderator());
revoke all on public.crew_membership_overview from anon;
grant select on public.crew_membership_overview to authenticated;

-- Fix DEC-0061 leak.
create or replace view public.public_drivers as
  select driver_id,
         case when hide_display_name then 'Anonymous Driver'::text else display_name end as display_name,
         created_at
  from public.drivers
  where deleted_at is null;
