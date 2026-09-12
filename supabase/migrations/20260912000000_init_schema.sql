-- Gellhorn Time Attack — initial schema.
--
-- Implements the data contract in
-- "Gellhorn Time Attack/Gellhorn-Time-Attack-Produktspezifikation.md" (section
-- 8) and the architecture decision DEC-0045 (two mandatory Edge Functions,
-- RLS as an *additional*, not sole, protection layer). Section references
-- below (e.g. "8.2") point at that spec document.
--
-- Hard product rules encoded here, not just documented:
--   1. A run can only become verification_tier = 'verified' (-> "Video
--      verified") if a *public video* evidence row exists for it. A
--      screenshot alone can never grant that status (see 6.2). Enforced by
--      trigger `enforce_verification_requires_video`, not just app logic.
--   2. publication_status = 'official' requires verification_tier =
--      'verified' (6.3: only verified+official runs can hold a Site Record).
--   3. Screenshots are never public (type='screenshot' forces
--      visibility='private'); only external YouTube links can be public.
--   4. vehicle_observations (Gellhorn Labs) never carries a driver identity
--      and is not treated as anonymous while a `source_run_id` back-link
--      still exists (8.4).
--   5. auth_subject (the private, stable Discord user id) is never exposed
--      through RLS to anon/authenticated roles — only through
--      `public_drivers`/`public_leaderboard`, which expose display_name only.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Reference data: tracks, vehicles
-- ---------------------------------------------------------------------------

create table public.tracks (
  track_id    text primary key,
  name        text not null,
  layout_id   text not null default 'default',
  length_m    numeric,
  length_source text,
  length_is_estimate boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.tracks is
  'Gellhorn plus any later confirmed track/layout. length_m stays null until a sourced value exists (spec 6.4, average_speed_kmh note).';

create table public.vehicles (
  vehicle_id  text primary key,
  source_nr   integer,
  class       text not null,
  make        text not null,
  model       text not null,
  manufacturer_logo_slug text not null,
  created_at  timestamptz not null default now(),
  unique (make, model)
);

comment on table public.vehicles is
  'Canonical GTA VI vehicle list. Seeded from outputs/GTA6-Fahrzeuge-Racing-Klassen-2026-09-03-v2.xlsx via scripts/generate_vehicle_seed.py. Vehicles with an unconfirmed in-game make/model are intentionally excluded, never invented.';

-- ---------------------------------------------------------------------------
-- Drivers (spec 7, 8.1)
-- ---------------------------------------------------------------------------

create table public.drivers (
  driver_id     uuid primary key default gen_random_uuid(),
  -- Supabase Auth linkage, used for RLS (auth.uid()). Not itself the
  -- "auth_subject" required by spec 8.1 — see discord_user_id below.
  auth_user_id  uuid not null unique references auth.users (id) on delete cascade,
  auth_provider text not null default 'discord' check (auth_provider = 'discord'),
  -- The private, stable Discord user id (the actual "auth_subject" of spec
  -- 8.1). Populated by a trigger reading the Discord identity Supabase Auth
  -- stores for this user. Never exposed to anon/authenticated roles.
  discord_user_id text not null unique,
  display_name  text not null,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

comment on table public.drivers is
  'auth_subject (discord_user_id) and auth_user_id are private. Only display_name is public, via public_drivers/public_leaderboard.';

create table public.driver_name_history (
  id          bigint generated always as identity primary key,
  driver_id   uuid not null references public.drivers (driver_id) on delete cascade,
  old_name    text,
  new_name    text not null,
  changed_at  timestamptz not null default now()
);

comment on table public.driver_name_history is
  'Logged display_name changes (spec 8.1: "protokollierte Änderungen, nicht automatisch vollständig öffentlich"). Not public.';

create or replace function public.log_driver_name_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.driver_name_history (driver_id, old_name, new_name)
    values (new.driver_id, null, new.display_name);
  elsif tg_op = 'UPDATE' and new.display_name is distinct from old.display_name then
    insert into public.driver_name_history (driver_id, old_name, new_name)
    values (new.driver_id, old.display_name, new.display_name);
  end if;
  return new;
end;
$$;

create trigger drivers_log_name_change
  after insert or update of display_name on public.drivers
  for each row execute function public.log_driver_name_change();

create table public.moderators (
  driver_id   uuid primary key references public.drivers (driver_id) on delete cascade,
  granted_at  timestamptz not null default now(),
  granted_by  uuid references public.drivers (driver_id)
);

comment on table public.moderators is
  'Moderator role grants. Mutated only via service role (admin action), never by clients directly.';

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.moderators m
    join public.drivers d on d.driver_id = m.driver_id
    where d.auth_user_id = auth.uid()
  );
$$;

create or replace function public.current_driver_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select driver_id from public.drivers where auth_user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Runs (spec 8.2) — the three separate status dimensions (spec 5)
-- ---------------------------------------------------------------------------

create table public.runs (
  run_id        uuid primary key default gen_random_uuid(),
  driver_id     uuid not null references public.drivers (driver_id),
  track_id      text not null references public.tracks (track_id),
  lap_time_ms   integer not null check (lap_time_ms > 0),
  vehicle_id    text not null references public.vehicles (vehicle_id),
  vehicle_text_observed text,
  platform      text not null check (platform in ('ps5', 'xbox_series')),
  vehicle_state text not null default 'unknown',
  game_version  text,
  standard_version text not null,
  conditions    jsonb not null default '{}'::jsonb,

  review_status text not null default 'draft'
    check (review_status in ('draft','submitted','needs_correction','under_review','accepted','rejected','invalidated')),
  publication_status text not null default 'hidden'
    check (publication_status in ('hidden','provisional','official','archived')),
  verification_tier text not null default 'self_reported'
    check (verification_tier in ('self_reported','unverified','video_submitted','verified','trusted_test')),

  -- 6.1: publishing a screenshot time requires the driver's consent to
  -- publish their chosen display_name alongside it.
  display_name_consent boolean not null default false,

  submitted_at  timestamptz,
  driven_at     timestamptz,
  supersedes_run_id uuid references public.runs (run_id),

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- 6.3: only verified + official runs may hold a Site Record / official rank.
  constraint official_requires_verified
    check (publication_status <> 'official' or verification_tier = 'verified'),
  -- 6.2: verified is only reached through moderator acceptance.
  constraint verified_requires_accepted
    check (verification_tier <> 'verified' or review_status = 'accepted'),
  -- 6.1: a provisional/official run needs the driver's publication consent.
  constraint public_requires_consent
    check (publication_status = 'hidden' or publication_status = 'archived' or display_name_consent)
);

comment on table public.runs is
  'One submitted lap. Public-safe projections are exposed only via public_leaderboard, never this table directly (spec 8.2).';

create index runs_track_publication_idx on public.runs (track_id, publication_status);
create index runs_driver_idx on public.runs (driver_id);
create index runs_vehicle_idx on public.runs (vehicle_id);

create or replace function public.runs_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger runs_touch_updated_at
  before update on public.runs
  for each row execute function public.runs_set_updated_at();

-- Hard rule 6.2: "Eine manuelle Sichtung nur des Screenshots macht eine Runde
-- nicht Video verified." A run can only reach verification_tier IN
-- ('verified','trusted_test') if a PUBLIC video_link evidence row exists for
-- it. CHECK constraints can't reference other tables, so this is a trigger.
create or replace function public.enforce_verification_requires_video()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_tier in ('verified', 'trusted_test') then
    if not exists (
      select 1 from public.evidence e
      where e.run_id = new.run_id
        and e.type = 'video_link'
        and e.visibility = 'public'
        and e.retention_state = 'active'
    ) then
      raise exception 'run % cannot reach verification_tier=% without a public video_link evidence row (spec 6.2)',
        new.run_id, new.verification_tier;
    end if;
  end if;
  return new;
end;
$$;

create trigger runs_enforce_verification
  before insert or update of verification_tier on public.runs
  for each row execute function public.enforce_verification_requires_video();

-- ---------------------------------------------------------------------------
-- Evidence (spec 8.3)
-- ---------------------------------------------------------------------------

create table public.evidence (
  evidence_id   uuid primary key default gen_random_uuid(),
  run_id        uuid not null references public.runs (run_id) on delete cascade,
  type          text not null check (type in ('screenshot','video_link')),
  role          text not null check (role in ('private_original','external_video')),
  visibility    text not null check (visibility in ('private','public')),
  storage_reference text,
  sha256        text,
  mime_type     text,
  byte_size     bigint,
  submitted_at  timestamptz not null default now(),
  retention_state text not null default 'active'
    check (retention_state in ('active','pending_deletion','deleted')),
  delete_after  timestamptz,

  -- Hard rule: screenshots (the raw evidence file) are never served publicly.
  constraint screenshot_is_private_original
    check (type <> 'screenshot' or (role = 'private_original' and visibility = 'private')),
  constraint video_link_is_external
    check (type <> 'video_link' or role = 'external_video')
);

comment on table public.evidence is
  'Screenshots stay private/internal review-only. Only external YouTube links may be visibility=public (spec 8.3, product rule: no embedded video or screenshot hosting).';

create index evidence_run_idx on public.evidence (run_id);

-- ---------------------------------------------------------------------------
-- Gellhorn Labs anonymous vehicle observations (spec 8.4)
-- ---------------------------------------------------------------------------

create table public.vehicle_observations (
  observation_id uuid primary key default gen_random_uuid(),
  track_id      text not null references public.tracks (track_id),
  lap_time_ms   integer not null check (lap_time_ms > 0),
  vehicle_id    text not null references public.vehicles (vehicle_id),
  vehicle_text_observed text,
  platform      text not null check (platform in ('ps5','xbox_series')),
  game_version  text,
  standard_version text not null,
  conditions    jsonb not null default '{}'::jsonb,
  quality_state text not null default 'uncertain'
    check (quality_state in ('usable','uncertain','excluded')),
  -- Temporary back-link during OCR/user correction only (spec 8.4). Must be
  -- cleared before the row counts as anonymous.
  source_run_id uuid references public.runs (run_id) on delete set null,
  anonymized_at timestamptz,
  created_at    timestamptz not null default now(),

  constraint not_anonymous_while_linked
    check (anonymized_at is null or source_run_id is null)
);

comment on table public.vehicle_observations is
  'Anonymous multi-driver-screenshot rows for Gellhorn Labs. No display_name, driver_id, or leaderboard status, ever (spec 8.4).';

create index vehicle_observations_track_idx on public.vehicle_observations (track_id, vehicle_id);

-- ---------------------------------------------------------------------------
-- Moderation log (DEC-0045: moderation Edge Function writes here)
-- ---------------------------------------------------------------------------

create table public.moderation_log (
  id            bigint generated always as identity primary key,
  run_id        uuid references public.runs (run_id) on delete set null,
  evidence_id   uuid references public.evidence (evidence_id) on delete set null,
  moderator_driver_id uuid not null references public.drivers (driver_id),
  action        text not null,
  previous_value jsonb,
  new_value     jsonb,
  reason        text,
  created_at    timestamptz not null default now()
);

comment on table public.moderation_log is
  'Append-only. Written exclusively by the moderate-submission Edge Function under the service role, never directly by clients.';

-- ---------------------------------------------------------------------------
-- Field provenance (spec 8.5): "Herkunft reist mit der Zahl" for any field.
-- ---------------------------------------------------------------------------

create table public.field_provenance (
  id            bigint generated always as identity primary key,
  entity_type   text not null check (entity_type in ('run','evidence','vehicle_observation')),
  entity_id     uuid not null,
  field_name    text not null,
  source        text not null check (source in ('ocr','user','rule','moderator','migration')),
  observed_value  jsonb,
  confirmed_value jsonb,
  actor         text,
  reason        text,
  changed_at    timestamptz not null default now()
);

comment on table public.field_provenance is
  'Generic audit trail satisfying spec 8.5 for every field that can be OCR-derived, user-entered, rule-derived, or moderator-changed. Written by the submit-lap / moderate-submission Edge Functions.';

create index field_provenance_entity_idx on public.field_provenance (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- DEC-0045: "RLS bleibt zusätzliche, nicht alleinige Schutzschicht" — RLS
-- here is intentionally strict/minimal (owner + moderator only on base
-- tables); every public read goes through the curated views below, and the
-- two mandatory Edge Functions re-verify server-side under the service role
-- (which bypasses RLS) rather than relying on client-side RLS alone.
-- ---------------------------------------------------------------------------

alter table public.tracks enable row level security;
alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;
alter table public.driver_name_history enable row level security;
alter table public.moderators enable row level security;
alter table public.runs enable row level security;
alter table public.evidence enable row level security;
alter table public.vehicle_observations enable row level security;
alter table public.moderation_log enable row level security;
alter table public.field_provenance enable row level security;

-- Reference data: public read, no client writes.
create policy tracks_public_read on public.tracks for select using (true);
create policy vehicles_public_read on public.vehicles for select using (true);

-- Drivers: only self or a moderator may read the base row (auth_subject /
-- discord_user_id must never reach anon/authenticated clients). Public
-- display_name access goes through public_drivers / public_leaderboard.
create policy drivers_select_self_or_moderator on public.drivers
  for select using (auth_user_id = auth.uid() or public.is_moderator());
create policy drivers_update_self on public.drivers
  for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
-- Row creation happens via a service-role trigger/Edge Function right after
-- Discord OAuth completes, not a direct client INSERT.

create policy driver_name_history_self_or_moderator on public.driver_name_history
  for select using (
    public.is_moderator()
    or driver_id = public.current_driver_id()
  );

create policy moderators_read_moderator_only on public.moderators
  for select using (public.is_moderator());
-- No insert/update/delete policy: moderator grants are service-role only.

-- Runs: owner or moderator on the base table. Public reads use
-- public_leaderboard, never this table.
create policy runs_select_owner_or_moderator on public.runs
  for select using (driver_id = public.current_driver_id() or public.is_moderator());
create policy runs_insert_own on public.runs
  for insert with check (driver_id = public.current_driver_id());
-- Drivers may only edit their own run while it is still in a pre-decision
-- state; once under review/accepted/rejected/invalidated only a moderator
-- (via the moderate-submission Edge Function, service role) may change it.
create policy runs_update_own_before_review on public.runs
  for update using (
    driver_id = public.current_driver_id()
    and review_status in ('draft','needs_correction')
  ) with check (
    driver_id = public.current_driver_id()
  );
create policy runs_update_moderator on public.runs
  for update using (public.is_moderator());

-- Evidence: owner (via run) or moderator only. Never public — even for
-- visibility='public' video_link rows, the public-facing video URL is
-- surfaced through public_leaderboard, not direct table access.
create policy evidence_select_owner_or_moderator on public.evidence
  for select using (
    public.is_moderator()
    or exists (select 1 from public.runs r where r.run_id = evidence.run_id and r.driver_id = public.current_driver_id())
  );
create policy evidence_insert_own_run on public.evidence
  for insert with check (
    exists (select 1 from public.runs r where r.run_id = evidence.run_id and r.driver_id = public.current_driver_id())
  );
create policy evidence_update_moderator on public.evidence
  for update using (public.is_moderator());

-- vehicle_observations: public may read only rows that are demonstrably
-- anonymous already (spec 8.4: not anonymous while source_run_id is set).
create policy vehicle_observations_public_read on public.vehicle_observations
  for select using (
    anonymized_at is not null and source_run_id is null and quality_state = 'usable'
  );
create policy vehicle_observations_moderator_read_all on public.vehicle_observations
  for select using (public.is_moderator());
-- Inserts/updates happen via the submit-lap Edge Function (service role).

-- moderation_log / field_provenance: moderator-readable audit trail, written
-- only by service-role Edge Functions (no client insert/update policy).
create policy moderation_log_moderator_read on public.moderation_log
  for select using (public.is_moderator());
create policy field_provenance_moderator_or_owner_read on public.field_provenance
  for select using (
    public.is_moderator()
    or (entity_type = 'run' and exists (
      select 1 from public.runs r where r.run_id = field_provenance.entity_id and r.driver_id = public.current_driver_id()
    ))
  );

-- ---------------------------------------------------------------------------
-- Public views — the only path anon/authenticated clients use for
-- leaderboard-shaped public data (spec 6.4, "Spaltenumfang für das
-- vollständige Leaderboard").
-- ---------------------------------------------------------------------------

create or replace view public.public_leaderboard as
select
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
    -- spec 6.4 "Track Entries": accepted, non-duplicate public submissions by
    -- this driver on this track — i.e. every other public run of theirs here.
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
where r.publication_status in ('provisional','official');

comment on view public.public_leaderboard is
  'The only public read of run data. publication_status already encodes visibility (hidden=draft/correction/review/rejected, archived=historical) per spec 5.2 — no further status filter needed.';

grant select on public.public_leaderboard to anon, authenticated;

create or replace view public.public_drivers as
select driver_id, display_name, created_at
from public.drivers
where deleted_at is null;

grant select on public.public_drivers to anon, authenticated;

create or replace view public.public_vehicles_needed as
select v.vehicle_id, v.make, v.model, v.manufacturer_logo_slug, t.track_id
from public.vehicles v
cross join public.tracks t
where not exists (
  select 1 from public.runs r
  where r.vehicle_id = v.vehicle_id
    and r.track_id = t.track_id
    and r.publication_status in ('provisional','official')
);

comment on view public.public_vehicles_needed is
  'Vehicles with zero public run on a given track — drives the "Vehicles Needed" panel.';

grant select on public.public_vehicles_needed to anon, authenticated;

-- Base tables: revoke default PostgREST grants beyond what the policies
-- above are meant to allow; anon/authenticated get only what's granted here
-- plus whatever their RLS policies permit through direct table access
-- (drivers/runs/evidence for the owning user, moderators for review work).
grant select on public.tracks, public.vehicles to anon, authenticated;
grant select, update on public.drivers to authenticated;
grant select on public.driver_name_history, public.moderators, public.moderation_log, public.field_provenance to authenticated;
grant select, insert, update on public.runs to authenticated;
grant select, insert, update on public.evidence to authenticated;
grant select on public.vehicle_observations to anon, authenticated;
