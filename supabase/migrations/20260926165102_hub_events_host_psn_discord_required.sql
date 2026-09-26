-- RS-0035 (2026-09-26, DEC-0077): every event needs
--   1) the host's PSN name (shown as "Hosted by <PSN> <crew tag>"), and
--   2) at least one Discord to meet the host: the event's own invite and/or
--      a host crew that has a Discord invite (both allowed).
-- hub_events is empty at this point, so the constraints apply to all rows.
alter table public.hub_events drop constraint if exists hub_events_host_name_check;
alter table public.hub_events alter column host_name set not null;
alter table public.hub_events add constraint hub_events_host_psn_check
  check (host_name ~ '^[A-Za-z][A-Za-z0-9_-]{2,15}$');
comment on column public.hub_events.host_name is 'PSN Online ID of the host (3-16 chars, starts with a letter). DEC-0077.';

create or replace function public.hub_events_require_discord()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.discord_url is null and not exists (
       select 1 from public.crews c where c.crew_id = new.host_crew_id and c.discord_url is not null) then
    raise exception 'discord_required: add a Discord invite or pick a host crew that has one'
      using errcode = '23514';
  end if;
  return new;
end $$;
revoke execute on function public.hub_events_require_discord() from public, anon, authenticated;
create trigger hub_events_require_discord
  before insert or update of discord_url, host_crew_id on public.hub_events
  for each row execute function public.hub_events_require_discord();
