-- RS-0063 (DEC-0094): crew leaders invite drivers; the driver accepts or
-- declines. Invites don't count towards the 5-crew limit (checked on accept).
-- Max 20 open invites per crew; a declined driver can't be re-invited by the
-- same crew for 30 days. Run once in the Supabase SQL Editor. Safe to re-run.

begin;

-- 1) New status 'invited' + who invited
alter table public.crew_memberships drop constraint if exists crew_memberships_status_check;
alter table public.crew_memberships add constraint crew_memberships_status_check
  check (status in ('invited', 'pending', 'active'));
alter table public.crew_memberships add column if not exists invited_by uuid references public.drivers(driver_id) on delete set null;

create table if not exists public.crew_invite_declines (
  crew_id uuid not null references public.crews(crew_id) on delete cascade,
  driver_id uuid not null references public.drivers(driver_id) on delete cascade,
  declined_at timestamptz not null default now(),
  primary key (crew_id, driver_id)
);
alter table public.crew_invite_declines enable row level security;
-- no policies: only reachable through the security-definer functions below

-- 2) Limits (replaces the RS-0062 version)
create or replace function public.crew_memberships_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'invited' then
    if (select count(*) from public.crew_memberships m where m.crew_id = new.crew_id and m.status = 'invited') >= 20 then
      raise exception 'invite_limit: a crew can have at most 20 open invites' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.crew_invite_declines x where x.crew_id = new.crew_id and x.driver_id = new.driver_id and x.declined_at > now() - interval '30 days') then
      raise exception 'invite_declined: this driver declined an invite from this crew in the last 30 days' using errcode = 'P0001';
    end if;
  elsif (select count(*) from public.crew_memberships m where m.driver_id = new.driver_id and m.status in ('pending', 'active')) >= 5 then
    raise exception 'crew_limit: a driver can be in at most 5 crews (including open requests)' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- 3) Leaders may insert invites for their crew
drop policy if exists crew_memberships_invite on public.crew_memberships;
create policy crew_memberships_invite on public.crew_memberships for insert
  with check (
    status = 'invited' and invited_by = public.current_driver_id()
    and decided_at is null and decided_by is null
    and (public.is_crew_leader(crew_id) or public.is_moderator())
    and exists (select 1 from public.crews c where c.crew_id = crew_memberships.crew_id and c.is_published)
  );

-- 4) Driver accepts / declines (drivers cannot update rows directly)
create or replace function public.accept_crew_invite(p_crew uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := public.current_driver_id();
begin
  if me is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.crew_memberships where driver_id = me and crew_id = p_crew and status = 'invited') then
    raise exception 'no open invite from this crew';
  end if;
  if (select count(*) from public.crew_memberships where driver_id = me and status in ('pending', 'active')) >= 5 then
    raise exception 'crew_limit: a driver can be in at most 5 crews (including open requests)' using errcode = 'P0001';
  end if;
  update public.crew_memberships set status = 'active' where driver_id = me and crew_id = p_crew and status = 'invited';
end $$;

create or replace function public.decline_crew_invite(p_crew uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := public.current_driver_id();
begin
  if me is null then raise exception 'not signed in'; end if;
  delete from public.crew_memberships where driver_id = me and crew_id = p_crew and status = 'invited';
  if found then
    insert into public.crew_invite_declines (crew_id, driver_id, declined_at) values (p_crew, me, now())
    on conflict (crew_id, driver_id) do update set declined_at = excluded.declined_at;
  end if;
end $$;

-- 5) Leader search: find drivers to invite (prefix match on display name, min. 3 characters, max. 10 results)
create or replace function public.search_drivers_for_invite(p_crew uuid, p_query text)
returns table (driver_id uuid, display_name text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_crew_leader(p_crew) or public.is_moderator()) then raise exception 'not allowed'; end if;
  if char_length(btrim(coalesce(p_query, ''))) < 3 then return; end if;
  return query
    select d.driver_id, d.display_name from public.drivers d
    where d.deleted_at is null and d.display_name is not null
      and d.display_name ilike replace(replace(btrim(p_query), '%', ''), '_', '\_') || '%'
      and not exists (select 1 from public.crew_memberships m where m.crew_id = p_crew and m.driver_id = d.driver_id)
    order by d.display_name limit 10;
end $$;

revoke all on function public.accept_crew_invite(uuid) from public, anon;
revoke all on function public.decline_crew_invite(uuid) from public, anon;
revoke all on function public.search_drivers_for_invite(uuid, text) from public, anon;
grant execute on function public.accept_crew_invite(uuid) to authenticated;
grant execute on function public.decline_crew_invite(uuid) to authenticated;
grant execute on function public.search_drivers_for_invite(uuid, text) to authenticated;

-- 6) Overview view: who invited (appended column)
create or replace view public.crew_membership_overview as
 select m.membership_id, m.crew_id, c.name as crew_name, c.tag, c.color, c.slug, m.driver_id, d.display_name,
        m.status, m.requested_at, m.decided_at, m.is_primary, inv.display_name as invited_by_name
   from crew_memberships m join crews c on c.crew_id = m.crew_id join drivers d on d.driver_id = m.driver_id
   left join drivers inv on inv.driver_id = m.invited_by
  where d.deleted_at is null and (m.driver_id = current_driver_id() or is_crew_leader(m.crew_id) or is_moderator());

commit;
