-- Bug: public_leaderboard showed one row PER RUN, not per driver+vehicle
-- personal best. A driver submitting the same car/track combo multiple
-- times (retries, improved times, re-submissions after a correction)
-- cluttered the table with every accepted run instead of just their best.
--
-- Fix: DISTINCT ON (driver_id, vehicle_id, track_id), ordered so the
-- fastest lap_time_ms per group wins. Postgres requires the DISTINCT ON
-- columns to be a prefix of ORDER BY, so lap_time_ms asc comes right
-- after them.
--
-- No frontend change needed -- Leaderboard.astro already just selects
-- from this view and sorts by lap_time_ms, so it gets one row per
-- driver/vehicle for free once the view itself dedupes.

create or replace view public.public_leaderboard as
select distinct on (r.driver_id, r.vehicle_id, r.track_id)
  r.run_id,
  r.track_id,
  d.display_name as driver,
  v.vehicle_id,
  v.make,
  v.model,
  v.manufacturer_logo_slug,
  r.platform,
  r.lap_time_ms,
  r.standard_version,
  r.publication_status,
  r.verification_tier,
  case when r.verification_tier = 'verified' then true else false end as video_verified,
  (
    select ev.storage_reference
    from public.evidence ev
    where ev.run_id = r.run_id
      and ev.type = 'video_link'
      and ev.visibility = 'public'
      and ev.retention_state = 'active'
    order by ev.submitted_at desc
    limit 1
  ) as video_url,
  (
    select count(*)
    from public.runs r2
    where r2.driver_id = r.driver_id
      and r2.track_id = r.track_id
      and r2.publication_status in ('provisional','official')
  ) as track_entries,
  r.submitted_at
from public.runs r
join public.drivers d on d.driver_id = r.driver_id
join public.vehicles v on v.vehicle_id = r.vehicle_id
where r.publication_status in ('provisional','official')
order by r.driver_id, r.vehicle_id, r.track_id, r.lap_time_ms asc;

grant select on public.public_leaderboard to anon, authenticated;
