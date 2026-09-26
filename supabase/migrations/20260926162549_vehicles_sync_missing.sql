-- RS-0032 fix (2026-09-26): 10 garage vehicles were on the website
-- (site/src/data/vehicles.ts) but missing in public.vehicles, so owning or
-- submitting a lap with them failed (foreign key). Adds them; source_nr stays
-- null (not from the original workbook numbering).
insert into public.vehicles (vehicle_id, class, make, model, manufacturer_logo_slug) values
  ('annis-hellion', 'Off-Road', 'Annis', 'Hellion', 'annis'),
  ('fathom-fr36', 'Coupes', 'Fathom', 'FR36', 'fathom'),
  ('grotti-itali-rsx', 'Sports', 'Grotti', 'Itali RSX', 'grotti'),
  ('karin-rebel', 'Off-Road', 'Karin', 'Rebel', 'karin'),
  ('maibatsu-penumbra-ff', 'Sports', 'Maibatsu', 'Penumbra FF', 'maibatsu'),
  ('mammoth-patriot-mil-spec', 'Off-Road', 'Mammoth', 'Patriot Mil-Spec', 'mammoth'),
  ('pegassi-infernus-classic', 'Sports Classics', 'Pegassi', 'Infernus Classic', 'pegassi'),
  ('pfister-neon', 'Sports', 'Pfister', 'Neon', 'pfister'),
  ('ubermacht-sentinel-classic-cabrio', 'Sports Classics', 'Übermacht', 'Sentinel Classic Cabrio', 'ubermacht'),
  ('vapid-caracara', 'Off-Road', 'Vapid', 'Caracara', 'vapid')
on conflict (vehicle_id) do nothing;