-- RS-0022, 2026-09-25. Live angewendet am 2026-09-25 (Version 20260925020831).
-- The Hub (DEC-0062): Crew-Uebersicht und Eventkalender.
--
-- Designentscheidungen:
--   * Oeffentlich lesbar ist nur, was `is_published = true` ist.
--     Moderatoren sehen alles (Entwuerfe).
--   * Schreiben vorerst nur Moderatoren (= Betreiber). Crew Leader /
--     Event Hosts (RS-0022 Schritt 5/7) bekommen spaeter eigene Policies;
--     dafuer muss hier nichts umziehen.
--   * Keine Crew-Logos (Nutzerentscheidung 25.09.): Darstellung ueber
--     Crew-Tag (1-4 Zeichen, A-Z/0-9) + Crew-Farbe als Hex.
--   * member_count wird manuell gepflegt (z. B. Wert aus dem Social Club),
--     bis es echte Mitgliedschaften auf der Plattform gibt (Schritt 6).
--   * Event-Zeiten als timestamptz (UTC gespeichert); die Website zeigt sie
--     in der Ortszeit des Besuchers.

-- ---------------------------------------------------------------------------
-- Crews
-- ---------------------------------------------------------------------------
create table public.crews (
  crew_id          uuid primary key default gen_random_uuid(),
  slug             text not null unique
                     check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 48),
  name             text not null check (char_length(btrim(name)) between 2 and 40),
  tag              text not null check (tag ~ '^[A-Z0-9]{1,4}$'),
  color            text not null default '#ed253d' check (color ~ '^#[0-9a-fA-F]{6}$'),
  platforms        text[] not null default '{}'
                     check (platforms <@ array['ps5','xbox']::text[]),
  focus            text[] not null default '{}'
                     check (focus <@ array['racing','time-attack','league','drift','car-meet','cruise']::text[]),
  region           text check (region is null or char_length(region) <= 40),
  language         text check (language is null or char_length(language) <= 40),
  description      text check (description is null or char_length(description) <= 400),
  member_count     integer check (member_count is null or member_count >= 0),
  discord_url      text check (discord_url is null or discord_url ~ '^https://(discord\.gg|discord\.com/invite)/[A-Za-z0-9-]+$'),
  social_club_url  text check (social_club_url is null or social_club_url ~ '^https://socialclub\.rockstargames\.com/'),
  is_partner       boolean not null default false,
  is_published     boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.crews is
  'The Hub crew directory (DEC-0062). Curated by moderators for now; no logos, tag + color only.';

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create table public.hub_events (
  event_id      uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(btrim(title)) between 3 and 80),
  event_type    text not null
                  check (event_type in ('race','time-attack','league','car-meet','cruise','other')),
  starts_at     timestamptz not null,
  ends_at       timestamptz check (ends_at is null or ends_at > starts_at),
  platforms     text[] not null default '{}'
                  check (platforms <@ array['ps5','xbox']::text[]),
  host_crew_id  uuid references public.crews (crew_id) on delete set null,
  host_name     text check (host_name is null or char_length(host_name) <= 60),
  location      text check (location is null or char_length(location) <= 80),
  description   text check (description is null or char_length(description) <= 600),
  join_url      text check (join_url is null or join_url ~ '^https://'),
  status        text not null default 'scheduled' check (status in ('scheduled','cancelled')),
  is_published  boolean not null default false,
  created_by    uuid references public.drivers (driver_id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index hub_events_starts_at_idx on public.hub_events (starts_at);
create index hub_events_host_crew_id_idx on public.hub_events (host_crew_id);
create index hub_events_created_by_idx on public.hub_events (created_by);

comment on table public.hub_events is
  'The Hub event calendar (DEC-0062). Curated by moderators for now; event hosts later (RS-0022 step 7).';

-- ---------------------------------------------------------------------------
-- updated_at touch (eigene Funktion, gleiche Haertung wie runs_set_updated_at)
-- ---------------------------------------------------------------------------
create or replace function public.hub_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.hub_set_updated_at() from public;

create trigger crews_touch_updated_at
  before update on public.crews
  for each row execute function public.hub_set_updated_at();
create trigger hub_events_touch_updated_at
  before update on public.hub_events
  for each row execute function public.hub_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.crews enable row level security;
alter table public.hub_events enable row level security;

create policy crews_public_read on public.crews
  for select using (is_published or public.is_moderator());
create policy crews_moderator_insert on public.crews
  for insert with check (public.is_moderator());
create policy crews_moderator_update on public.crews
  for update using (public.is_moderator()) with check (public.is_moderator());
create policy crews_moderator_delete on public.crews
  for delete using (public.is_moderator());

create policy hub_events_public_read on public.hub_events
  for select using (is_published or public.is_moderator());
create policy hub_events_moderator_insert on public.hub_events
  for insert with check (public.is_moderator());
create policy hub_events_moderator_update on public.hub_events
  for update using (public.is_moderator()) with check (public.is_moderator());
create policy hub_events_moderator_delete on public.hub_events
  for delete using (public.is_moderator());
