-- RS-0029 (2026-09-26): Zeiten melden (DEC-0071). Bewusst NICHT als Button
-- im Leaderboard, sondern ueber eine Seite im Footer (Nutzer: sonst zu viele
-- Spass-Meldungen). Nur mit Login, nur veroeffentlichte Zeiten, pro Person
-- und Zeit einmal, max. 5 offene Meldungen je Person, Begruendung Pflicht.
-- Oeffentlich sieht niemand, dass eine Zeit gemeldet wurde.

create table public.run_reports (
  report_id          uuid primary key default gen_random_uuid(),
  run_id             uuid not null references public.runs (run_id) on delete cascade,
  reporter_driver_id uuid not null references public.drivers (driver_id) on delete cascade,
  reason             text not null check (reason in ('unrealistic_time', 'wrong_vehicle', 'wrong_track_or_conditions', 'other')),
  details            text not null check (char_length(btrim(details)) between 20 and 1000),
  status             text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at         timestamptz not null default now(),
  handled_at         timestamptz,
  handled_by         uuid references public.drivers (driver_id) on delete set null,
  moderator_note     text check (moderator_note is null or char_length(moderator_note) <= 500),
  unique (run_id, reporter_driver_id)
);
create index run_reports_status_idx on public.run_reports (status, created_at);
create index run_reports_reporter_idx on public.run_reports (reporter_driver_id);
create index run_reports_handled_by_idx on public.run_reports (handled_by);
comment on table public.run_reports is 'Reports of suspicious published lap times (RS-0029). Not public.';

-- Report target must be a published run (security definer: runs RLS is strict).
create or replace function public.run_is_published(p_run uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.runs where run_id = p_run and publication_status in ('provisional', 'official'));
$$;

alter table public.run_reports enable row level security;
create policy run_reports_select on public.run_reports
  for select using (reporter_driver_id = public.current_driver_id() or public.is_moderator());
create policy run_reports_insert on public.run_reports
  for insert with check (
    reporter_driver_id = public.current_driver_id()
    and status = 'open' and handled_at is null and handled_by is null and moderator_note is null
    and public.run_is_published(run_id)
    and (select count(*) from public.run_reports r
         where r.reporter_driver_id = public.current_driver_id() and r.status = 'open') < 5
  );
create policy run_reports_moderate on public.run_reports
  for update using (public.is_moderator()) with check (public.is_moderator());
create policy run_reports_delete on public.run_reports
  for delete using ((reporter_driver_id = public.current_driver_id() and status = 'open') or public.is_moderator());
grant select, insert, update, delete on public.run_reports to authenticated;

-- Retention (DEC-0070): never delete the screenshot of a run with an open report.
create or replace function public.evidence_due_for_deletion(p_days integer default 60)
returns table (evidence_id uuid, storage_reference text)
language sql stable security definer set search_path = public as $$
  with pub as (
    select run_id, vehicle_id, track_id, lap_time_ms, submitted_at
    from public.runs
    where publication_status in ('provisional', 'official')
  ),
  current_best as (
    select distinct on (vehicle_id, track_id) run_id
    from pub
    order by vehicle_id, track_id, lap_time_ms, submitted_at
  ),
  overtaken as (
    select r.run_id,
           (select min(b.submitted_at) from pub b
             where b.vehicle_id = r.vehicle_id and b.track_id = r.track_id
               and b.lap_time_ms < r.lap_time_ms and b.submitted_at > r.submitted_at) as overtaken_at
    from pub r
    where not exists (select 1 from pub f
                      where f.vehicle_id = r.vehicle_id and f.track_id = r.track_id
                        and f.lap_time_ms < r.lap_time_ms and f.submitted_at <= r.submitted_at)
  )
  select e.evidence_id, e.storage_reference
  from public.evidence e
  join public.runs ru on ru.run_id = e.run_id
  left join overtaken o on o.run_id = e.run_id
  where e.type = 'screenshot'
    and e.retention_state = 'active'
    and e.storage_reference is not null
    and ru.review_status in ('accepted', 'rejected', 'invalidated')
    and e.run_id not in (select run_id from current_best)
    and not exists (select 1 from public.run_reports rr where rr.run_id = e.run_id and rr.status = 'open')
    and greatest(e.submitted_at, coalesce(o.overtaken_at, e.submitted_at)) < now() - make_interval(days => p_days);
$$;
revoke execute on function public.evidence_due_for_deletion(integer) from public, anon, authenticated;
grant execute on function public.evidence_due_for_deletion(integer) to service_role;
