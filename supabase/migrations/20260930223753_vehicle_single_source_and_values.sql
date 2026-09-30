-- RS-0052 (DEC-0089): the database is the single source of vehicle data; measured values carry provenance.
-- Website builds read vehicles, values and game_releases from here (site/scripts/fetch-vehicles.mjs).

-- 1) Vehicle base data that so far only lived in site/src/data/vehicles.ts
alter table public.vehicles
  add column classes text[],
  add column seats smallint check (seats between 1 and 16),
  add column drive text check (drive in ('RWD', 'FWD', 'AWD')),          -- null = unknown
  add column acquisition text check (acquisition in ('pre-order', 'ultimate-edition', 'gta-plus')),
  add column has_photo boolean not null default false,
  add column updated_at timestamptz not null default now(),
  add column updated_by uuid references public.drivers (driver_id) on delete set null;

update public.vehicles v
set classes = d.classes, seats = d.seats, drive = d.drive, acquisition = d.acquisition, has_photo = d.has_photo
from (values
  ('vapid-stanier-55', array['Sedans']::text[], 2, 'RWD', 'pre-order', true),
  ('grotti-cheetah-95', array['Sports Classics']::text[], 2, 'RWD', 'ultimate-edition', true),
  ('schyster-deviant', array['Muscle']::text[], 2, 'RWD', 'ultimate-edition', true),
  ('declasse-mamba-gt', array['Sports Classics']::text[], 2, 'RWD', 'ultimate-edition', true),
  ('vapid-riata-classic', array['SUVs']::text[], 2, null, 'ultimate-edition', true),
  ('dundreary-sirius', array['Muscle']::text[], 2, null, 'ultimate-edition', true),
  ('obey-8f-drafter', array['Sports']::text[], 2, 'AWD', null, false),
  ('vapid-aleutian', array['SUVs']::text[], 4, 'AWD', null, false),
  ('albany-alpha', array['Sports']::text[], 2, 'RWD', null, false),
  ('karin-asterope-gz', array['Sedans']::text[], 4, 'RWD', null, false),
  ('pfister-astron', array['SUVs']::text[], 4, 'AWD', null, false),
  ('gallivanter-baller-ii', array['SUVs']::text[], 4, 'AWD', null, false),
  ('gallivanter-baller-st-d', array['SUVs']::text[], 4, 'AWD', null, false),
  ('bravado-banshee', array['Sports']::text[], 2, 'RWD', null, false),
  ('dinka-blista-compact', array['Sports']::text[], 2, 'FWD', null, false),
  ('albany-buccaneer', array['Muscle']::text[], 2, 'RWD', null, false),
  ('albany-buccaneer-custom', array['Muscle']::text[], 2, 'RWD', null, false),
  ('bravado-buffalo', array['Sports']::text[], 4, 'RWD', null, false),
  ('bravado-buffalo-stx', array['Muscle']::text[], 4, 'RWD', null, false),
  ('grotti-carbonizzare', array['Sports']::text[], 2, 'RWD', null, false),
  ('albany-cavalcade-xl', array['SUVs']::text[], 4, 'AWD', null, false),
  ('vapid-chino', array['Muscle']::text[], 2, 'RWD', null, false),
  ('pfister-comet-retro-custom', array['Sports']::text[], 2, 'RWD', null, false),
  ('pfister-comet-s2-cabrio', array['Sports']::text[], 2, 'RWD', null, false),
  ('karin-contender', array['SUVs']::text[], 4, 'AWD', null, false),
  ('invetero-coquette', array['Sports']::text[], 2, 'RWD', null, false),
  ('invetero-coquette-d10', array['Sports']::text[], 2, 'RWD', null, false),
  ('ubermacht-cypher', array['Sports']::text[], 2, 'RWD', null, false),
  ('imponte-df8-90', array['Sedans']::text[], 4, 'RWD', null, false),
  ('vapid-dominator', array['Muscle']::text[], 2, 'RWD', null, false),
  ('vapid-dominator-asp', array['Muscle']::text[], 2, 'RWD', null, false),
  ('vapid-dominator-gt', array['Muscle']::text[], 2, 'RWD', null, false),
  ('vapid-dominator-gtx', array['Muscle']::text[], 2, 'RWD', null, false),
  ('bravado-dorado', array['SUVs']::text[], 4, 'AWD', null, false),
  ('benefactor-dubsta', array['SUVs']::text[], 4, 'AWD', null, false),
  ('annis-elegy-retro-custom', array['Sports']::text[], 2, 'AWD', null, false),
  ('albany-emperor', array['Sedans']::text[], 4, 'RWD', null, false),
  ('karin-feroci', array['Sedans']::text[], 4, 'RWD', null, false),
  ('grotti-furia', array['Super']::text[], 2, 'AWD', null, false),
  ('karin-futo', array['Sports']::text[], 2, 'RWD', null, false),
  ('vapid-ganado-70', array['Muscle']::text[], 2, null, null, true),
  ('bravado-gauntlet-classic', array['Muscle']::text[], 2, 'RWD', null, false),
  ('bravado-gauntlet-hellfire', array['Muscle']::text[], 2, 'RWD', null, false),
  ('declasse-granger', array['SUVs']::text[], 8, 'AWD', null, false),
  ('declasse-granger-3600lx', array['SUVs']::text[], 8, 'AWD', null, false),
  ('pfister-growler', array['Sports']::text[], 2, 'RWD', null, false),
  ('declasse-impaler-80', array['Muscle']::text[], 4, 'RWD', null, false),
  ('declasse-impaler-sz', array['Muscle']::text[], 4, 'RWD', null, false),
  ('vulcar-ingot', array['Sedans']::text[], 4, 'FWD', null, false),
  ('karin-intruder', array['Sedans']::text[], 4, 'RWD', null, false),
  ('buckingham-jubilee', array['SUVs']::text[], 4, 'AWD', null, false),
  ('ocelot-jugular', array['Sports']::text[], 4, 'AWD', null, false),
  ('dundreary-landstalker-xl', array['SUVs']::text[], 4, 'AWD', null, false),
  ('ocelot-locust', array['Sports']::text[], 2, 'RWD', null, false),
  ('albany-manana', array['Sports Classics']::text[], 2, 'RWD', null, false),
  ('canis-mesa', array['SUVs']::text[], 4, 'AWD', null, false),
  ('vapid-montagne', array['SUVs']::text[], 4, null, null, false),
  ('declasse-moonbeam', array['Muscle']::text[], 4, 'RWD', null, false),
  ('lampadati-novak', array['SUVs']::text[], 4, 'AWD', null, false),
  ('obey-omnis-e-gt', array['Sports']::text[], 4, 'AWD', null, false),
  ('enus-paragon-r', array['Sports']::text[], 2, 'AWD', null, false),
  ('maibatsu-penumbra', array['Sports']::text[], 2, 'RWD', null, false),
  ('imponte-phoenix', array['Muscle']::text[], 2, 'RWD', null, false),
  ('schyster-pmp-700', array['Sedans']::text[], 4, 'RWD', null, false),
  ('albany-primo', array['Sedans']::text[], 4, 'RWD', null, false),
  ('coil-raiden', array['Sports']::text[], 4, 'AWD', null, false),
  ('dundreary-regina', array['Sedans']::text[], 4, 'RWD', null, false),
  ('imponte-ruiner', array['Muscle']::text[], 2, 'RWD', null, false),
  ('declasse-sabre-turbo', array['Muscle']::text[], 2, 'RWD', null, false),
  ('benefactor-schafter-v12', array['Sedans', 'Sports']::text[], 4, 'RWD', null, false),
  ('canis-seminole-frontier', array['SUVs']::text[], 4, 'AWD', null, false),
  ('ubermacht-sentinel-classic', array['Sports Classics']::text[], 2, 'RWD', null, false),
  ('ubermacht-sentinel-xs', array['Coupes']::text[], 2, 'RWD', null, false),
  ('vapid-slamvan', array['Muscle']::text[], 2, 'RWD', null, false),
  ('vapid-stanier', array['Sedans']::text[], 4, 'RWD', null, false),
  ('zirconium-stratum', array['Sedans']::text[], 4, 'AWD', null, false),
  ('dinka-sugoi', array['Sports']::text[], 4, 'FWD', null, false),
  ('karin-sultan', array['Sports']::text[], 4, 'AWD', null, false),
  ('obey-tailgater', array['Sedans']::text[], 4, 'RWD', null, false),
  ('obey-tailgater-s', array['Sedans']::text[], 4, 'RWD', null, false),
  ('pegassi-tempesta', array['Super']::text[], 2, 'AWD', null, false),
  ('truffade-thrax', array['Super']::text[], 2, 'AWD', null, false),
  ('declasse-tornado', array['Sports Classics']::text[], 2, 'RWD', null, false),
  ('pegassi-toros', array['SUVs']::text[], 4, 'AWD', null, false),
  ('declasse-tulip', array['Muscle']::text[], 4, 'RWD', null, false),
  ('declasse-tulip-m-100', array['Muscle']::text[], 2, 'RWD', null, false),
  ('albany-v-str', array['Sports']::text[], 4, 'RWD', null, false),
  ('declasse-vamos', array['Muscle']::text[], 2, 'RWD', null, false),
  ('emperor-vectre', array['Sports']::text[], 2, 'AWD', null, false),
  ('declasse-vigero-zx-convertible', array['Muscle']::text[], 2, 'RWD', null, false),
  ('karin-vivanite', array['SUVs']::text[], 4, 'AWD', null, false),
  ('enus-windsor', array['Coupes']::text[], 2, 'RWD', null, false),
  ('benefactor-xls', array['SUVs']::text[], 4, 'AWD', null, false),
  ('ubermacht-zion', array['Coupes']::text[], 2, 'RWD', null, false),
  ('ubermacht-zion-cabrio', array['Coupes']::text[], 2, 'RWD', null, false),
  ('pegassi-zorrusso', array['Super']::text[], 2, 'RWD', null, false),
  ('karin-rebel', array['Off-Road']::text[], 2, 'AWD', null, false),
  ('vapid-caracara-4x4', array['Off-Road']::text[], 4, 'AWD', null, false),
  ('pfister-neon', array['Sports']::text[], 4, 'AWD', null, false),
  ('annis-hellion', array['Off-Road']::text[], 2, 'AWD', null, false),
  ('pegassi-infernus-classic', array['Sports Classics']::text[], 2, 'RWD', null, false),
  ('fathom-fr36', array['Coupes']::text[], 2, 'RWD', null, false),
  ('mammoth-patriot-mil-spec', array['Off-Road']::text[], 4, 'AWD', null, false),
  ('grotti-itali-rsx', array['Sports']::text[], 2, 'AWD', null, false),
  ('maibatsu-penumbra-ff', array['Sports']::text[], 2, 'AWD', null, false),
  ('ubermacht-sentinel-classic-cabrio', array['Sports Classics']::text[], 2, 'RWD', null, false),
  ('canis-kamacho', array['Off-Road']::text[], 4, 'AWD', null, true),
  ('vapid-dominator-67-buggy', array['Off-Road']::text[], 2, null, 'ultimate-edition', true)
) as d (vehicle_id, classes, seats, drive, acquisition, has_photo)
where v.vehicle_id = d.vehicle_id;

alter table public.vehicles
  alter column classes set not null,
  add constraint vehicles_classes_not_empty check (cardinality(classes) >= 1);
alter table public.vehicles drop column class;   -- replaced by classes (a vehicle can have two GTA classes)

-- 2) Change log for vehicle base data (who changed what, old/new)
create table public.vehicle_change_log (
  id bigserial primary key,
  vehicle_id text not null,
  changed_by uuid references public.drivers (driver_id) on delete set null,
  changed_at timestamptz not null default now(),
  action text not null check (action in ('insert', 'update')),
  old_row jsonb,
  new_row jsonb
);
alter table public.vehicle_change_log enable row level security;
create policy vehicle_change_log_moderator_read on public.vehicle_change_log for select to authenticated using (public.is_moderator());
grant select on public.vehicle_change_log to authenticated;

create or replace function public.vehicles_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    new.updated_by := public.current_driver_id();
  end if;
  return new;
end; $$;
create trigger vehicles_touch before update on public.vehicles for each row execute function public.vehicles_audit();

create or replace function public.vehicles_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.vehicle_change_log (vehicle_id, changed_by, action, old_row, new_row)
  values (new.vehicle_id, public.current_driver_id(), lower(tg_op),
          case when tg_op = 'UPDATE' then to_jsonb(old) end, to_jsonb(new));
  return null;
end; $$;
create trigger vehicles_log after insert or update on public.vehicles for each row execute function public.vehicles_log();

-- Moderators maintain vehicles (public read policy already exists)
create policy vehicles_moderator_insert on public.vehicles for insert to authenticated with check (public.is_moderator());
create policy vehicles_moderator_update on public.vehicles for update to authenticated using (public.is_moderator()) with check (public.is_moderator());
grant insert, update on public.vehicles to authenticated;

-- 3) Measured / published values with provenance (price, top speed, reference lap ...)
-- Every value keeps its source, game version and evidence; a new current value supersedes the old one
-- instead of overwriting it (Codex blueprint P3/P4). Methodology itself is decided separately.
create table public.vehicle_values (
  value_id uuid primary key default gen_random_uuid(),
  vehicle_id text not null references public.vehicles (vehicle_id) on update cascade,
  metric text not null check (metric in ('price_gtad', 'top_speed_mph', 'gellhorn_reference_lap_ms')),
  value numeric not null check (value > 0),
  source_type text not null check (source_type in ('in_game', 'rockstar', 'controlled_test', 'community', 'derived')),
  method text check (method is null or char_length(method) <= 40),          -- e.g. methodology version
  game_release_id text references public.game_releases (release_id),
  platform text check (platform in ('ps5', 'xbox')),
  measured_at date,
  evidence_url text check (evidence_url is null or evidence_url ~ '^https://'),
  note text check (note is null or char_length(note) <= 300),
  status text not null default 'current' check (status in ('current', 'superseded', 'rejected')),
  created_by uuid references public.drivers (driver_id) on delete set null default public.current_driver_id(),
  created_at timestamptz not null default now()
);
create unique index vehicle_values_one_current on public.vehicle_values (vehicle_id, metric) where status = 'current';
create index vehicle_values_vehicle on public.vehicle_values (vehicle_id);

create or replace function public.vehicle_values_supersede()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'current' then
    update public.vehicle_values set status = 'superseded'
    where vehicle_id = new.vehicle_id and metric = new.metric and status = 'current' and value_id <> new.value_id;
  end if;
  return new;
end; $$;
create trigger vehicle_values_supersede before insert or update of status on public.vehicle_values
  for each row execute function public.vehicle_values_supersede();

alter table public.vehicle_values enable row level security;
create policy vehicle_values_public_read on public.vehicle_values for select to public using (status in ('current', 'superseded'));
create policy vehicle_values_moderator_read on public.vehicle_values for select to authenticated using (public.is_moderator());
create policy vehicle_values_moderator_insert on public.vehicle_values for insert to authenticated with check (public.is_moderator());
create policy vehicle_values_moderator_update on public.vehicle_values for update to authenticated using (public.is_moderator()) with check (public.is_moderator());
grant select on public.vehicle_values to anon, authenticated;
grant insert, update on public.vehicle_values to authenticated;
