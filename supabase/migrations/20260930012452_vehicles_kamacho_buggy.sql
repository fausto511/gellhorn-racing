-- 2026-09-30: two vehicles added to the site (Fausto supplied photos; data
-- from gtabase.com GTA 6 pages). Needed here so laps with them can be
-- submitted (runs.vehicle_id FK). Class = first class in site/src/data/vehicles.ts.
insert into public.vehicles (vehicle_id, class, make, model, manufacturer_logo_slug) values
  ('canis-kamacho',            'Off-Road', 'Canis', 'Kamacho',             'canis'),
  ('vapid-dominator-67-buggy', 'Off-Road', 'Vapid', 'Dominator ''67 Buggy', 'vapid')
on conflict (vehicle_id) do nothing;
