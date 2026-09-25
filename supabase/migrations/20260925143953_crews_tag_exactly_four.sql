-- RS-0022 (2026-09-26): Crew-Tag hat immer genau 4 Zeichen (Nutzervorgabe
-- 25.09.). Vorher 1-4. [UNSICHER] ob GTA VI kuerzere Tags erlaubt -- bei
-- Abweichung nach Release wieder lockern.
alter table public.crews drop constraint crews_tag_check;
alter table public.crews add constraint crews_tag_check check (tag ~ '^[A-Z0-9]{4}$');
