-- RS-0062 (DEC-0093): up to 5 crews per driver with one primary crew,
-- plus moderator notes on crews and events (2026-10-02).
-- Supersedes the one-crew rule of DEC-0066.
-- Run once in the Supabase SQL Editor (the MCP tool needs a confirmation for
-- the DROP INDEX that it could not get). Safe to re-run.

begin;

-- 1) One crew per driver -> up to 5 (pending requests count)
drop index if exists public.crew_memberships_one_per_driver;
create unique index if not exists crew_memberships_driver_crew on public.crew_memberships (driver_id, crew_id);

alter table public.crew_memberships add column if not exists is_primary boolean not null default false;
alter table public.crew_memberships drop constraint if exists crew_memberships_primary_active;
alter table public.crew_memberships add constraint crew_memberships_primary_active check (not is_primary or status = 'active');
create unique index if not exists crew_memberships_one_primary on public.crew_memberships (driver_id) where is_primary;

create or replace function public.crew_memberships_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.crew_memberships m where m.driver_id = new.driver_id) >= 5 then
    raise exception 'crew_limit: a driver can be in at most 5 crews (including open requests)' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists crew_memberships_limit on public.crew_memberships;
create trigger crew_memberships_limit before insert on public.crew_memberships
  for each row execute function public.crew_memberships_limit();

-- 2) Exactly one primary among active memberships (earliest joined first)
create or replace function public.crew_memberships_ensure_primary(p_driver uuid) returns void
language sql security definer set search_path = public as $$
  update public.crew_memberships set is_primary = true
  where membership_id = (
    select m.membership_id from public.crew_memberships m
    where m.driver_id = p_driver and m.status = 'active'
    order by m.decided_at nulls last, m.requested_at
    limit 1)
  and not exists (select 1 from public.crew_memberships x where x.driver_id = p_driver and x.is_primary);
$$;
create or replace function public.crew_memberships_after_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.crew_memberships_ensure_primary(coalesce(new.driver_id, old.driver_id));
  return null;
end $$;
drop trigger if exists crew_memberships_primary on public.crew_memberships;
create trigger crew_memberships_primary after insert or update of status or delete on public.crew_memberships
  for each row execute function public.crew_memberships_after_change();

-- Member picks the primary crew (members cannot update rows directly)
create or replace function public.set_primary_crew(p_crew uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := public.current_driver_id();
begin
  if me is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.crew_memberships where driver_id = me and crew_id = p_crew and status = 'active') then
    raise exception 'not an active member of this crew';
  end if;
  update public.crew_memberships set is_primary = false where driver_id = me and is_primary and crew_id <> p_crew;
  update public.crew_memberships set is_primary = true where driver_id = me and crew_id = p_crew;
end $$;
revoke all on function public.set_primary_crew(uuid) from public, anon;
grant execute on function public.set_primary_crew(uuid) to authenticated;
revoke all on function public.crew_memberships_limit() from public, anon, authenticated;
revoke all on function public.crew_memberships_after_change() from public, anon, authenticated;
revoke all on function public.crew_memberships_ensure_primary(uuid) from public, anon, authenticated;

-- 3) Views expose is_primary (columns appended at the end)
create or replace view public.public_crew_roster as
 select m.crew_id, c.tag, c.color, m.driver_id, d.display_name, m.decided_at as joined_at, m.is_primary
   from crew_memberships m join crews c on c.crew_id = m.crew_id join drivers d on d.driver_id = m.driver_id
  where m.status = 'active' and c.is_published and d.deleted_at is null;
create or replace view public.crew_membership_overview as
 select m.membership_id, m.crew_id, c.name as crew_name, c.tag, c.color, c.slug, m.driver_id, d.display_name,
        m.status, m.requested_at, m.decided_at, m.is_primary
   from crew_memberships m join crews c on c.crew_id = m.crew_id join drivers d on d.driver_id = m.driver_id
  where d.deleted_at is null and (m.driver_id = current_driver_id() or is_crew_leader(m.crew_id) or is_moderator());

select public.crew_memberships_ensure_primary(driver_id) from (select distinct driver_id from public.crew_memberships) s;

-- 4) Moderator notes on crews and events (shown to the crew leader / host)
alter table public.crews add column if not exists moderation_note text
  check (moderation_note is null or char_length(moderation_note) <= 300);
alter table public.hub_events add column if not exists moderation_note text
  check (moderation_note is null or char_length(moderation_note) <= 300);

-- Only moderators set the note or the publish state; leaders/hosts keep editing
-- their content, but cannot re-publish something a moderator hid.
create or replace function public.hub_protect_moderation_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_moderator() then
    new.moderation_note := old.moderation_note;
    new.is_published := old.is_published;
  end if;
  return new;
end $$;
revoke all on function public.hub_protect_moderation_fields() from public, anon, authenticated;
drop trigger if exists crews_protect_moderation on public.crews;
create trigger crews_protect_moderation before update on public.crews
  for each row execute function public.hub_protect_moderation_fields();
drop trigger if exists hub_events_protect_moderation on public.hub_events;
create trigger hub_events_protect_moderation before update on public.hub_events
  for each row execute function public.hub_protect_moderation_fields();

commit;
