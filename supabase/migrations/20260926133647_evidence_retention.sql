-- RS-0028: live applied as version 20260926133647 (evidence_retention).
-- RS-0028 (2026-09-26): Aufbewahrung von Screenshot-Belegen (DEC-0070).
--   * Screenshots werden nach 60 Tagen geloescht.
--   * Ausnahme: der Beleg der aktuellen Bestzeit JEDES Fahrzeugs auf jeder
--     Strecke bleibt, solange sie Bestzeit ist; wird sie ueberboten, laeuft
--     ab dann die 60-Tage-Frist.
--   * Belege noch nicht abgeschlossener Pruefungen werden nie geloescht.
--   * Aufraeumen alle 30 Tage (pg_cron -> pg_net -> Edge Function
--     cleanup-evidence, die die Dateien ueber die Storage-API loescht).
-- Die Zeiten selbst bleiben erhalten; nur die Bilddatei wird entfernt
-- (evidence.retention_state = 'deleted').

create extension if not exists pg_cron;
create extension if not exists pg_net;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.job_tokens (
  name  text primary key,
  token text not null
);
insert into private.job_tokens (name, token)
values ('cleanup-evidence', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (name) do nothing;

-- Token check for the edge function (service role only).
create or replace function public.check_job_token(p_name text, p_token text)
returns boolean language sql stable security definer set search_path = public, private as $$
  select exists (select 1 from private.job_tokens where name = p_name and token = p_token);
$$;
revoke execute on function public.check_job_token(text, text) from public, anon, authenticated;
grant execute on function public.check_job_token(text, text) to service_role;

-- Which screenshot files may be deleted now.
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
    -- only runs that WERE the best time when submitted get the grace
    -- period from the moment they were beaten
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
    and greatest(e.submitted_at, coalesce(o.overtaken_at, e.submitted_at)) < now() - make_interval(days => p_days);
$$;
revoke execute on function public.evidence_due_for_deletion(integer) from public, anon, authenticated;
grant execute on function public.evidence_due_for_deletion(integer) to service_role;

-- Every 30 days (1st of each month, 03:17 UTC).
select cron.schedule(
  'cleanup-evidence-monthly',
  '17 3 1 * *',
  $cron$
    select net.http_post(
      url := 'https://pprzkexqltudeuqjnsqa.supabase.co/functions/v1/cleanup-evidence',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-job-token', (select token from private.job_tokens where name = 'cleanup-evidence')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
  $cron$
);
