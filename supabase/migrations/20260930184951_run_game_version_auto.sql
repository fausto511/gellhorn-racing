-- RS-0048 (DEC-0085): game version per run is derived from the lap date, never typed by the driver.
-- runs.game_version now references game_releases.release_id. Latest release whose date <= lap date
-- (driven_at, else submitted_at, else now; compared as UTC date). Before the first dated release
-- (pre-launch test runs) the base game is used. Moderators can still correct it (e.g. update day).

update public.runs set game_version = null
where game_version is not null
  and game_version not in (select release_id from public.game_releases);

alter table public.runs
  add constraint runs_game_version_fkey foreign key (game_version) references public.game_releases (release_id);

create or replace function public.game_release_for(p_at timestamptz)
returns text
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select release_id from public.game_releases
      where release_date is not null and release_date <= (p_at at time zone 'UTC')::date
      order by release_date desc, sort_order desc
      limit 1),
    (select release_id from public.game_releases
      where kind = 'base-game'
      order by sort_order
      limit 1)
  );
$$;

create or replace function public.runs_set_game_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.game_version := public.game_release_for(coalesce(new.driven_at, new.submitted_at, now()));
  elsif new.driven_at is distinct from old.driven_at
        and new.game_version is not distinct from old.game_version then
    new.game_version := public.game_release_for(coalesce(new.driven_at, new.submitted_at, now()));
  end if;
  return new;
end;
$$;

create trigger runs_set_game_version
  before insert or update of driven_at on public.runs
  for each row execute function public.runs_set_game_version();
