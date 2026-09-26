-- RS-0034 (2026-09-26): events usually take place on the host's own Discord
-- server -- hosts can add a Discord invite so participants can actually
-- connect (DEC-0076). Same format rule as crews.discord_url.
alter table public.hub_events add column discord_url text
  check (discord_url is null or discord_url ~ '^https://(discord\.gg|discord\.com/invite)/[A-Za-z0-9-]+$');
comment on column public.hub_events.discord_url is 'Invite to the Discord server where the event takes place (optional; falls back to the host crew''s Discord).';
