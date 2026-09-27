-- 2026-09-27 (RS-0040): cleanup after the website push. The "hide my name"
-- option was replaced by account deletion (DEC-0079); the inert column
-- drivers.hide_display_name and its lock trigger can go now that no deployed
-- code reads or writes it (site + edge functions checked).
drop trigger if exists drivers_hide_name_removed on public.drivers;
drop function if exists public.drivers_hide_name_removed();

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

alter table public.drivers drop column hide_display_name;
