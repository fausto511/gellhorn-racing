-- Nachgetragen 2026-09-25 (RS-0022): war seit 2026-09-23 live angewendet,
-- fehlte aber als Datei im Repo (Migrations-Drift). Inhalt 1:1 aus
-- supabase_migrations.schema_migrations der Live-DB uebernommen.

-- Found while wiring up the anonymize feature: /account/'s own rank
-- calculation groups public_leaderboard rows by the `driver` text column
-- to count distinct competitors. Once hide_display_name lets more than
-- one driver show as "Anonymous Driver", that grouping silently merges
-- different people into one bucket and undercounts competitors -- a real
-- correctness bug the anonymize feature would otherwise introduce.
--
-- Fix: expose the stable driver_id (an opaque uuid, not itself
-- identifying) alongside the display label, so callers can group by
-- identity instead of by the label that identity can now hide behind.
-- Appended at the end of the column list -- CREATE OR REPLACE VIEW can't
-- reorder/insert existing columns, only add new ones after them.

create or replace view public.public_leaderboard as
select distinct on (r.driver_id, r.vehicle_id, r.track_id)
  r.run_id,
  r.track_id,
  case when d.hide_display_name then 'Anonymous Driver' else d.display_name end as driver,
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
  r.submitted_at,
  r.driver_id
from public.runs r
join public.drivers d on d.driver_id = r.driver_id
join public.vehicles v on v.vehicle_id = r.vehicle_id
where r.publication_status in ('provisional','official')
order by r.driver_id, r.vehicle_id, r.track_id, r.lap_time_ms asc;

grant select on public.public_leaderboard to anon, authenticated;
