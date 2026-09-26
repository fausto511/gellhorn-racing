-- RS-0035 correction (2026-09-26, DEC-0077 revised): the host must give
-- EITHER a PSN name (so players can add him on PlayStation) OR a Discord
-- (own invite or host crew with a Discord) -- or both. "Hosted by" falls back
-- to the creator's site display name when no PSN name is given.
-- PSN format per PlayStation manual: 3-16 chars, letters/digits/-/_, first
-- character a letter (manuals.playstation.net/document/en/store/signup.html).
alter table public.hub_events alter column host_name drop not null;
alter table public.hub_events drop constraint hub_events_host_psn_check;
alter table public.hub_events add constraint hub_events_host_psn_check
  check (host_name is null or host_name ~ '^[A-Za-z][A-Za-z0-9_-]{2,15}$');
comment on column public.hub_events.host_name is 'Host PSN Online ID (optional if a Discord is given). DEC-0077.';

create or replace function public.hub_events_require_contact()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.host_name is null and new.discord_url is null and not exists (
       select 1 from public.crews c where c.crew_id = new.host_crew_id and c.discord_url is not null) then
    raise exception 'contact_required: add your PSN name or a Discord invite (or pick a host crew that has one)'
      using errcode = '23514';
  end if;
  return new;
end $$;
revoke execute on function public.hub_events_require_contact() from public, anon, authenticated;
drop trigger hub_events_require_discord on public.hub_events;
drop function public.hub_events_require_discord();
create trigger hub_events_require_contact
  before insert or update of host_name, discord_url, host_crew_id on public.hub_events
  for each row execute function public.hub_events_require_contact();
