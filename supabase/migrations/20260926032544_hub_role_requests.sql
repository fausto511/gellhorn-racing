-- RS-0026: live applied as version 20260926032544 (hub_role_requests).
-- RS-0026 (2026-09-26): Antraege auf Crew Leader / Event Host (DEC-0068).
-- Ersetzt "Rollen nur per Moderator, kein oeffentlicher Antrag": Fahrer
-- stellen den Antrag im Account (beide Rollen gleichzeitig moeglich),
-- Moderatoren entscheiden. Freigabe = eine Funktion (atomar): legt bei
-- neuer Crew den Crew-Eintrag sofort OEFFENTLICH an (Nutzer: "Crews koennen
-- immer direkt oeffentlich sein") und vergibt die Rolle.

create table public.hub_role_requests (
  request_id           uuid primary key default gen_random_uuid(),
  driver_id            uuid not null references public.drivers (driver_id) on delete cascade,
  role                 text not null check (role in ('crew_leader','event_host')),
  status               text not null default 'pending' check (status in ('pending','approved','rejected')),
  -- crew_leader: EITHER an existing crew ...
  crew_id              uuid references public.crews (crew_id) on delete cascade,
  -- ... OR a new crew to be listed
  new_crew_name        text check (new_crew_name is null or char_length(btrim(new_crew_name)) between 2 and 40),
  new_crew_tag         text check (new_crew_tag is null or new_crew_tag ~ '^[A-Z0-9]{4}$'),
  new_crew_color       text check (new_crew_color is null or new_crew_color ~ '^#[0-9a-fA-F]{6}$'),
  new_crew_discord_url text check (new_crew_discord_url is null or new_crew_discord_url ~ '^https://(discord\.gg|discord\.com/invite)/[A-Za-z0-9-]+$'),
  new_crew_description text check (new_crew_description is null or char_length(new_crew_description) <= 400),
  -- free text to the moderator + optional link (Discord server, channel, stream ...)
  message              text check (message is null or char_length(message) <= 500),
  link_url             text check (link_url is null or (link_url ~ '^https://' and char_length(link_url) <= 200)),
  requested_at         timestamptz not null default now(),
  decided_at           timestamptz,
  decided_by           uuid references public.drivers (driver_id) on delete set null,
  decision_note        text check (decision_note is null or char_length(decision_note) <= 300),
  constraint hub_role_requests_target check (
    (role = 'crew_leader' and (
        (crew_id is not null and new_crew_name is null)
     or (crew_id is null and new_crew_name is not null and new_crew_tag is not null and new_crew_color is not null)))
    or (role = 'event_host' and crew_id is null and new_crew_name is null)
  )
);
create unique index hub_role_requests_one_open on public.hub_role_requests (driver_id, role) where status = 'pending';
create index hub_role_requests_status_idx on public.hub_role_requests (status, requested_at);
create index hub_role_requests_crew_idx on public.hub_role_requests (crew_id);
create index hub_role_requests_decided_by_idx on public.hub_role_requests (decided_by);
comment on table public.hub_role_requests is
  'Applications for Crew Leader / Event Host (RS-0026). Approve via approve_hub_role_request(); reject = status rejected.';

alter table public.hub_role_requests enable row level security;
create policy hub_role_requests_select on public.hub_role_requests
  for select using (driver_id = public.current_driver_id() or public.is_moderator());
create policy hub_role_requests_insert on public.hub_role_requests
  for insert with check (
    driver_id = public.current_driver_id()
    and status = 'pending' and decided_at is null and decided_by is null and decision_note is null
    and (crew_id is null or exists (select 1 from public.crews c where c.crew_id = hub_role_requests.crew_id and c.is_published))
  );
-- withdraw an open request (own) / clean up (moderator)
create policy hub_role_requests_delete on public.hub_role_requests
  for delete using ((driver_id = public.current_driver_id() and status = 'pending') or public.is_moderator());
-- reject (moderator); approval goes through the function below
create policy hub_role_requests_moderate on public.hub_role_requests
  for update using (public.is_moderator()) with check (public.is_moderator());
grant select, insert, update, delete on public.hub_role_requests to authenticated;

create or replace function public.approve_hub_role_request(p_request_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  r public.hub_role_requests;
  v_crew uuid;
  v_base text;
  v_slug text;
  n int := 1;
  v_mod uuid := public.current_driver_id();
begin
  if not public.is_moderator() then
    raise exception 'Only moderators can approve requests' using errcode = '42501';
  end if;
  select * into r from public.hub_role_requests where request_id = p_request_id for update;
  if not found then raise exception 'Request not found'; end if;
  if r.status <> 'pending' then raise exception 'Request was already decided'; end if;

  v_crew := r.crew_id;
  if r.role = 'crew_leader' and v_crew is null then
    v_base := left(trim(both '-' from regexp_replace(lower(r.new_crew_name), '[^a-z0-9]+', '-', 'g')), 40);
    if v_base = '' then v_base := 'crew'; end if;
    v_slug := v_base;
    while exists (select 1 from public.crews where slug = v_slug) loop
      n := n + 1; v_slug := v_base || '-' || n;
    end loop;
    insert into public.crews (slug, name, tag, color, discord_url, description, is_published)
    values (v_slug, btrim(r.new_crew_name), r.new_crew_tag, lower(r.new_crew_color), r.new_crew_discord_url, r.new_crew_description, true)
    returning crew_id into v_crew;
  end if;

  if not exists (select 1 from public.hub_roles h where h.driver_id = r.driver_id and h.role = r.role
                 and h.crew_id is not distinct from (case when r.role = 'crew_leader' then v_crew end)) then
    insert into public.hub_roles (driver_id, role, crew_id, granted_by)
    values (r.driver_id, r.role, case when r.role = 'crew_leader' then v_crew end, v_mod);
  end if;

  update public.hub_role_requests
     set status = 'approved', decided_at = now(), decided_by = v_mod
   where request_id = p_request_id;
  return v_crew;
end;
$$;
revoke execute on function public.approve_hub_role_request(uuid) from public, anon;
grant execute on function public.approve_hub_role_request(uuid) to authenticated;
