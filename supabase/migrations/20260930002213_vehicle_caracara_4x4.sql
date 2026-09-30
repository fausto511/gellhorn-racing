-- 2026-09-30: the GTA VI vehicle is the four-wheel Vapid Caracara 4x4, not the
-- six-wheel Caracara (checked by Fausto). Id vapid-caracara -> vapid-caracara-4x4,
-- model "Caracara" -> "Caracara 4x4". Foreign keys (runs, owned_vehicles,
-- vehicle_observations) are ON UPDATE NO ACTION, so the row is replaced:
-- insert the new one, move any references, delete the old one.
insert into public.vehicles (vehicle_id, source_nr, class, make, model, manufacturer_logo_slug, created_at)
select 'vapid-caracara-4x4', source_nr, class, make, 'Caracara 4x4', manufacturer_logo_slug, created_at
  from public.vehicles where vehicle_id = 'vapid-caracara'
on conflict (vehicle_id) do nothing;

update public.runs                 set vehicle_id = 'vapid-caracara-4x4' where vehicle_id = 'vapid-caracara';
update public.vehicle_observations set vehicle_id = 'vapid-caracara-4x4' where vehicle_id = 'vapid-caracara';
update public.owned_vehicles       set vehicle_id = 'vapid-caracara-4x4' where vehicle_id = 'vapid-caracara';

delete from public.vehicles where vehicle_id = 'vapid-caracara';
