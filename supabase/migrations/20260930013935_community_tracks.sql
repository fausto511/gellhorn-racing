-- 2026-09-30 (RS-0045): Creator role + community tracks ("Tracks" in The Hub).
-- Creators submit race jobs with a Social Club link and the key facts; a
-- moderator checks the facts against the link and publishes. Any edit by the
-- creator sends the track back to review (is_published = false).
-- Race-type list is a PLACEHOLDER until GTA VI's race types are known.

-- 1) creator role (granted directly or via role request, like event hosts)
alter table public.hub_roles drop constraint hub_roles_role_check;
alter table public.hub_roles add constraint hub_roles_role_check
  check (role = any (array['crew_leader', 'event_host', 'creator']));
alter table public.hub_role_requests drop constraint hub_role_requests_role_check;
alter table public.hub_role_requests add constraint hub_role_requests_role_check
  check (role = any (array['crew_leader', 'event_host', 'creator']));
alter table public.hub_role_requests drop constraint hub_role_requests_target;
alter table public.hub_role_requests add constraint hub_role_requests_target check (
  (role = 'crew_leader' and ((crew_id is not null and new_crew_name is null)
     or (crew_id is null and new_crew_name is not null and new_crew_tag is not null and new_crew_color is not null)))
  or (role in ('event_host', 'creator') and crew_id is null and new_crew_name is null));

create or replace function public.is_creator()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.hub_roles r
    join public.drivers d on d.driver_id = r.driver_id
    where d.auth_user_id = auth.uid() and r.role = 'creator'
  );
$$;
revoke execute on function public.is_creator() from public;
grant execute on function public.is_creator() to anon, authenticated;

-- 2) community tracks
create table public.community_tracks (
  track_id         uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(btrim(title)) between 2 and 60),
  social_club_url  text not null check (social_club_url ~ '^https://socialclub\.rockstargames\.com/' and char_length(social_club_url) <= 300),
  layout           text not null check (layout in ('circuit', 'point-to-point')),
  race_types       text[] not null default '{}'
                     check (race_types <@ array['standard','street','stunt','pursuit','open-wheel','transform','special-vehicle','drift']::text[]),
  vehicle_classes  text[] not null default '{}'
                     check (vehicle_classes <@ array['Coupes','Muscle','Off-Road','SUVs','Sedans','Sports','Sports Classics','Super']::text[]),
  players_min      integer not null check (players_min between 1 and 64),
  players_max      integer not null check (players_max between 1 and 64),
  length_km        numeric(6,2) not null check (length_km > 0 and length_km <= 500),
  is_published     boolean not null default false,
  review_note      text check (review_note is null or char_length(review_note) <= 300),
  created_by       uuid not null references public.drivers (driver_id) on delete cascade,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (players_min <= players_max),
  check (cardinality(race_types) >= 1),
  check (cardinality(vehicle_classes) >= 1)
);
create index community_tracks_created_by_idx on public.community_tracks (created_by);
create index community_tracks_published_idx on public.community_tracks (is_published, updated_at desc);
comment on table public.community_tracks is 'Community race jobs (Hub > Tracks, RS-0045). Creators submit, moderators check against the Social Club link and publish.';

create trigger community_tracks_touch_updated_at before update on public.community_tracks
  for each row execute function public.hub_set_updated_at();

-- non-moderators: cannot publish, cannot change owner; any edit -> back to review
create or replace function public.community_tracks_review_gate()
returns trigger language plpgsql set search_path = public as $$
begin
  if not public.is_moderator() then
    new.is_published := false;
    new.review_note := case when tg_op = 'UPDATE' then old.review_note else null end;
    if tg_op = 'UPDATE' then new.created_by := old.created_by; new.created_at := old.created_at; end if;
  end if;
  return new;
end;
$$;
create trigger community_tracks_review_gate before insert or update on public.community_tracks
  for each row execute function public.community_tracks_review_gate();

alter table public.community_tracks enable row level security;
create policy community_tracks_public_read on public.community_tracks for select
  using (is_published or public.is_moderator() or created_by = public.current_driver_id());
create policy community_tracks_creator_insert on public.community_tracks for insert
  with check (created_by = public.current_driver_id() and public.is_creator());
create policy community_tracks_creator_update on public.community_tracks for update
  using (created_by = public.current_driver_id() and public.is_creator())
  with check (created_by = public.current_driver_id() and public.is_creator());
create policy community_tracks_creator_delete on public.community_tracks for delete
  using (created_by = public.current_driver_id());
create policy community_tracks_moderator_all on public.community_tracks for all
  using (public.is_moderator()) with check (public.is_moderator());

grant select on public.community_tracks to anon, authenticated;
grant insert, update, delete on public.community_tracks to authenticated;

-- 3) account deletion also removes the driver's tracks (they carry his name)
create or replace function public.anonymize_driver_account(p_driver uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.drivers where driver_id = p_driver and deleted_at is null) then
    raise exception 'no active driver %', p_driver;
  end if;

  -- personal / social data
  delete from public.hub_event_rsvps     where driver_id = p_driver;
  delete from public.owned_vehicles      where driver_id = p_driver;
  delete from public.run_reports         where reporter_driver_id = p_driver;
  delete from public.content_reports     where reporter_driver_id = p_driver;
  delete from public.hub_events          where created_by = p_driver;   -- carry his PSN name
  delete from public.community_tracks    where created_by = p_driver;   -- carry his name as creator
  delete from public.hub_role_requests   where driver_id = p_driver;
  delete from public.hub_roles           where driver_id = p_driver;
  delete from public.crew_memberships    where driver_id = p_driver;
  delete from public.crew_membership_history where driver_id = p_driver;
  delete from public.moderators          where driver_id = p_driver;

  -- submissions nobody can review any more (no evidence left)
  delete from public.runs
   where driver_id = p_driver
     and review_status in ('draft', 'submitted', 'under_review', 'needs_correction');

  -- evidence of the remaining (reviewed) times
  update public.evidence e set storage_reference = null, retention_state = 'deleted', delete_after = now()
    from public.runs r
   where r.run_id = e.run_id and r.driver_id = p_driver and e.type = 'screenshot';
  delete from public.evidence e using public.runs r
   where r.run_id = e.run_id and r.driver_id = p_driver and e.type = 'video_link';

  -- the driver row: no name, no Discord, no login link
  update public.drivers
     set display_name = 'Deleted driver', discord_user_id = null, auth_user_id = null,
         deleted_at = now()
   where driver_id = p_driver;
  delete from public.driver_name_history where driver_id = p_driver;  -- incl. the row the rename just logged
end $$;
revoke execute on function public.anonymize_driver_account(uuid) from public, anon, authenticated;
grant execute on function public.anonymize_driver_account(uuid) to service_role;
