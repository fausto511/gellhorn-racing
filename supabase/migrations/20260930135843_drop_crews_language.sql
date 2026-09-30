-- 2026-10-01: the new site (RS-0044, pushed 30.09.) only uses crews.languages
-- (fixed list, multi-select). The old free-text column is no longer read or
-- written by any deployed code; no view or function depends on it.
alter table public.crews drop column language;
