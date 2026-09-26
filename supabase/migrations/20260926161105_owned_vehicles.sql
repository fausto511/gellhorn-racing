-- RS-0032 (2026-09-26): "My Garage" -- drivers mark which vehicles they own
-- (DEC-0074). Private for now: only the driver sees his own list.
create table public.owned_vehicles (
  driver_id  uuid not null references public.drivers (driver_id) on delete cascade,
  vehicle_id text not null references public.vehicles (vehicle_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (driver_id, vehicle_id)
);
create index owned_vehicles_vehicle_idx on public.owned_vehicles (vehicle_id);
comment on table public.owned_vehicles is 'Vehicles a driver owns in GTA VI (self-declared, private). RS-0032.';

alter table public.owned_vehicles enable row level security;
create policy owned_vehicles_select on public.owned_vehicles
  for select using (driver_id = public.current_driver_id());
create policy owned_vehicles_insert on public.owned_vehicles
  for insert with check (driver_id = public.current_driver_id());
create policy owned_vehicles_delete on public.owned_vehicles
  for delete using (driver_id = public.current_driver_id());
grant select, insert, delete on public.owned_vehicles to authenticated;
