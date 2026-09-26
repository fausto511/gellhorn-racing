-- RS-0037 (2026-09-26, DEC-0079): "Delete my account" replaces the
-- "Hide my name publicly" option (DEC-0061 / DEC-0078 superseded).
--   * Deleting an account removes all personal data; reviewed lap times stay
--     public as "Deleted driver". Screenshots are removed from storage by the
--     delete-account edge function BEFORE this runs; video links are dropped.
--   * Revoking the Discord authorization changes nothing here.
-- hide_display_name stays as an inert column until the new website is live
-- (then it can be dropped); nobody can switch it on any more.

-- 1) a deleted driver keeps his row (runs point to it) but loses the login link
alter table public.drivers alter column auth_user_id drop not null;
alter table public.drivers alter column discord_user_id drop not null;

-- 2) public views: "Deleted driver" instead of "Anonymous Driver"
create or replace view public.public_leaderboard as
 SELECT DISTINCT ON (r.driver_id, r.vehicle_id, r.track_id) r.run_id,
    r.track_id,
        CASE
            WHEN d.deleted_at IS NOT NULL THEN 'Deleted driver'::text
            ELSE d.display_name
        END AS driver,
    v.vehicle_id,
    v.make,
    v.model,
    v.manufacturer_logo_slug,
    r.platform,
    r.lap_time_ms,
    r.standard_version,
    r.publication_status,
    r.verification_tier,
        CASE
            WHEN r.verification_tier = 'verified'::text THEN true
            ELSE false
        END AS video_verified,
    ( SELECT ev.storage_reference
           FROM evidence ev
          WHERE ev.run_id = r.run_id AND ev.type = 'video_link'::text AND ev.visibility = 'public'::text AND ev.retention_state = 'active'::text
          ORDER BY ev.submitted_at DESC
         LIMIT 1) AS video_url,
    ( SELECT count(*) AS count
           FROM runs r2
          WHERE r2.driver_id = r.driver_id AND r2.track_id = r.track_id AND (r2.publication_status = ANY (ARRAY['provisional'::text, 'official'::text]))) AS track_entries,
    r.submitted_at,
    r.driver_id
   FROM runs r
     JOIN drivers d ON d.driver_id = r.driver_id
     JOIN vehicles v ON v.vehicle_id = r.vehicle_id
  WHERE r.publication_status = ANY (ARRAY['provisional'::text, 'official'::text])
  ORDER BY r.driver_id, r.vehicle_id, r.track_id, r.lap_time_ms;

create or replace view public.public_drivers as
 SELECT driver_id, display_name, created_at
   FROM drivers
  WHERE deleted_at IS NULL;

create or replace view public.public_crew_roster as
 SELECT m.crew_id, c.tag, c.color, m.driver_id, d.display_name, m.decided_at AS joined_at
   FROM crew_memberships m
     JOIN crews c ON c.crew_id = m.crew_id
     JOIN drivers d ON d.driver_id = m.driver_id
  WHERE m.status = 'active'::text AND c.is_published AND d.deleted_at IS NULL;

create or replace view public.public_event_rsvps as
 SELECT r.event_id,
        CASE WHEN d.deleted_at IS NOT NULL THEN NULL::text ELSE d.display_name END AS display_name,
    r.created_at
   FROM hub_event_rsvps r
     JOIN hub_events e ON e.event_id = r.event_id AND e.is_published
     JOIN drivers d ON d.driver_id = r.driver_id;

-- 3) the hide option is gone: DEC-0078 triggers replaced by a plain lock
drop trigger if exists drivers_block_anonymous_role_holder on public.drivers;
drop function if exists public.drivers_block_anonymous_role_holder();
drop trigger if exists hub_roles_unhide_holder on public.hub_roles;
drop function if exists public.hub_roles_unhide_holder();
drop function if exists public.driver_has_public_role(uuid);
update public.drivers set hide_display_name = false where hide_display_name;

create or replace function public.drivers_hide_name_removed()
returns trigger language plpgsql as $$
begin
  if new.hide_display_name then
    raise exception 'hide_removed: hiding the name was replaced by account deletion (DEC-0079)' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger drivers_hide_name_removed
  before insert or update of hide_display_name on public.drivers
  for each row execute function public.drivers_hide_name_removed();

-- 4) screenshot files of a driver (the edge function deletes them first)
create or replace function public.account_evidence_files(p_driver uuid)
returns table (storage_reference text)
language sql stable security definer set search_path = public as $$
  select e.storage_reference
    from public.evidence e join public.runs r on r.run_id = e.run_id
   where r.driver_id = p_driver and e.type = 'screenshot' and e.storage_reference is not null;
$$;
revoke execute on function public.account_evidence_files(uuid) from public, anon, authenticated;
grant execute on function public.account_evidence_files(uuid) to service_role;

-- 5) the anonymisation itself (service role only, called by delete-account)
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
  delete from public.hub_events          where created_by = p_driver;   -- carry his PSN name
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
         hide_display_name = false, deleted_at = now()
   where driver_id = p_driver;
  delete from public.driver_name_history where driver_id = p_driver;  -- incl. the row the rename just logged
end $$;
revoke execute on function public.anonymize_driver_account(uuid) from public, anon, authenticated;
grant execute on function public.anonymize_driver_account(uuid) to service_role;
