-- RS-0051 (Fausto, 01.10.2026): events can be planned now, but the earliest start is GTA VI launch day
-- (Nov 19, 2026). 2026-11-18 10:00 UTC = Nov 19 00:00 in UTC+14, the first time zone to reach launch day;
-- the website additionally blocks anything before Nov 19 00:00 in the host's own time zone.
alter table public.hub_events
  add constraint hub_events_not_before_launch check (starts_at >= timestamptz '2026-11-18 10:00:00+00');
