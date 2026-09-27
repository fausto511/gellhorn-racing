-- 2026-09-27 (RS-0040): "Verified only" on the leaderboard showed a gap.
-- public_leaderboard keeps only the FASTEST published run per driver, vehicle
-- and track. If that run is not video-verified but a slower one is, the
-- driver vanished from the verified view completely. This view is the same
-- shape, but only over video-verified runs: the best VERIFIED run per
-- driver, vehicle and track. Used by the leaderboard's "Verified only" toggle.
create or replace view public.public_leaderboard_verified as
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
    true AS video_verified,
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
    AND r.verification_tier = 'verified'::text
  ORDER BY r.driver_id, r.vehicle_id, r.track_id, r.lap_time_ms;

revoke all on public.public_leaderboard_verified from public, anon, authenticated;
grant select on public.public_leaderboard_verified to anon, authenticated;
comment on view public.public_leaderboard_verified is 'Best video-verified published run per driver, vehicle and track (RS-0040). Same columns as public_leaderboard.';
