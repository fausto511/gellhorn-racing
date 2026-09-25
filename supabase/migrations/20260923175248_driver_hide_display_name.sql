-- Nachgetragen 2026-09-25 (RS-0022): war seit 2026-09-23 live angewendet,
-- fehlte aber als Datei im Repo (Migrations-Drift). Inhalt 1:1 aus
-- supabase_migrations.schema_migrations der Live-DB uebernommen.

-- Account-wide anonymize toggle (feature request 2026-09-23). A driver can
-- hide their display name from public output without losing the
-- underlying time -- the site still wants to use these lap times, the
-- driver just doesn't want to be named. Applies everywhere the name would
-- otherwise show (currently: public_leaderboard).
--
-- This also fixes a real, pre-existing gap: runs.display_name_consent has
-- existed since the initial schema, collected at submission time, but
-- public_leaderboard never actually checked it -- the view always showed
-- the driver's name regardless of what they consented to. Rather than
-- wire up the never-respected per-run flag, this migration replaces it
-- with a simpler account-wide switch (per product decision), and the view
-- now actually enforces something.

alter table public.drivers
  add column hide_display_name boolean not null default false;

comment on column public.drivers.hide_display_name is
  'Driver opted out of showing their real display_name publicly. Their lap times stay visible/usable; only the name is swapped for a generic label wherever it would otherwise be shown (see public_leaderboard).';

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
  r.submitted_at
from public.runs r
join public.drivers d on d.driver_id = r.driver_id
join public.vehicles v on v.vehicle_id = r.vehicle_id
where r.publication_status in ('provisional','official')
order by r.driver_id, r.vehicle_id, r.track_id, r.lap_time_ms asc;

grant select on public.public_leaderboard to anon, authenticated;
