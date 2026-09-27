-- RS-0039 (2026-09-27, DEC-0083): report content (crews, events, driver
-- names, anything else) -- notice & action in the sense of Art. 16 DSA.
-- Separate from run_reports ("Report a time", RS-0029), which stays as is.
--   * sign-in required (spam protection); anyone without Discord can use the
--     contact e-mail in the legal notice instead (stated on the page + terms)
--   * reason + explanation (20-2000 chars) + good-faith statement required
--   * max 5 open reports per person, one open report per person and target
--   * reporter sees own reports incl. status and the decision note (Art. 16(5))
--   * nobody else sees reports except moderators; nothing is public
--   * snapshot of the crew name / event title at report time, so the report
--     stays readable after the target was removed

create table public.content_reports (
  report_id          uuid primary key default gen_random_uuid(),
  target_type        text not null check (target_type in ('crew', 'event', 'driver_name', 'other')),
  target_crew_id     uuid references public.crews (crew_id) on delete set null,
  target_event_id    uuid references public.hub_events (event_id) on delete set null,
  target_text        text check (target_text is null or char_length(btrim(target_text)) between 2 and 300),
  target_snapshot    text,
  reason             text not null check (reason in ('illegal', 'hate_or_harassment', 'sexual_or_violent', 'spam_or_scam', 'impersonation', 'intellectual_property', 'other')),
  details            text not null check (char_length(btrim(details)) between 20 and 2000),
  good_faith         boolean not null check (good_faith),
  reporter_driver_id uuid not null references public.drivers (driver_id) on delete cascade,
  status             text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at         timestamptz not null default now(),
  handled_at         timestamptz,
  handled_by         uuid references public.drivers (driver_id) on delete set null,
  decision_note      text check (decision_note is null or char_length(decision_note) <= 1000),
  constraint content_reports_target_ck check (
    case target_type
      when 'crew'  then target_event_id is null
      when 'event' then target_crew_id is null
      else target_crew_id is null and target_event_id is null and target_text is not null
    end)
);
create index content_reports_status_idx on public.content_reports (status, created_at);
create index content_reports_reporter_idx on public.content_reports (reporter_driver_id);
create index content_reports_crew_idx on public.content_reports (target_crew_id);
create index content_reports_event_idx on public.content_reports (target_event_id);
create index content_reports_handled_by_idx on public.content_reports (handled_by);
create unique index content_reports_one_open_crew on public.content_reports (reporter_driver_id, target_crew_id) where status = 'open' and target_crew_id is not null;
create unique index content_reports_one_open_event on public.content_reports (reporter_driver_id, target_event_id) where status = 'open' and target_event_id is not null;
comment on table public.content_reports is 'Reports of crews, events, driver names or other content (RS-0039, Art. 16 DSA). Not public.';
comment on column public.content_reports.decision_note is 'Shown to the reporter together with the status.';

-- target must exist and be published at report time; snapshot the name.
create or replace function public.content_reports_prepare()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.target_type = 'crew' then
    select c.name || ' [' || c.tag || ']' into new.target_snapshot
      from public.crews c where c.crew_id = new.target_crew_id and c.is_published;
    if new.target_snapshot is null then
      raise exception 'target_not_found: crew' using errcode = '23514';
    end if;
  elsif new.target_type = 'event' then
    select e.title into new.target_snapshot
      from public.hub_events e where e.event_id = new.target_event_id and e.is_published;
    if new.target_snapshot is null then
      raise exception 'target_not_found: event' using errcode = '23514';
    end if;
  else
    new.target_snapshot := null;
  end if;
  return new;
end $$;
revoke execute on function public.content_reports_prepare() from public, anon, authenticated;
create trigger content_reports_prepare
  before insert on public.content_reports
  for each row execute function public.content_reports_prepare();

alter table public.content_reports enable row level security;
create policy content_reports_select on public.content_reports
  for select using (reporter_driver_id = public.current_driver_id() or public.is_moderator());
create policy content_reports_insert on public.content_reports
  for insert with check (
    reporter_driver_id = public.current_driver_id()
    and status = 'open' and handled_at is null and handled_by is null and decision_note is null
    and (select count(*) from public.content_reports r
         where r.reporter_driver_id = public.current_driver_id() and r.status = 'open') < 5
  );
create policy content_reports_moderate on public.content_reports
  for update using (public.is_moderator()) with check (public.is_moderator());
create policy content_reports_delete on public.content_reports
  for delete using ((reporter_driver_id = public.current_driver_id() and status = 'open') or public.is_moderator());
grant select, insert, update, delete on public.content_reports to authenticated;

-- account deletion (DEC-0079) also removes the reports someone sent
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
         hide_display_name = false, deleted_at = now()
   where driver_id = p_driver;
  delete from public.driver_name_history where driver_id = p_driver;  -- incl. the row the rename just logged
end $$;
revoke execute on function public.anonymize_driver_account(uuid) from public, anon, authenticated;
grant execute on function public.anonymize_driver_account(uuid) to service_role;
