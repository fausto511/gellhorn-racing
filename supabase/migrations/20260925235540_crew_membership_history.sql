-- RS-0025: live applied as version 20260925235540 (crew_membership_history).
-- RS-0025 (2026-09-26): Mitgliedschafts-Historie fuer das spaetere
-- Level-System (DEC-0067). Punkte zaehlen fuer eine Crew nur, wenn der
-- Fahrer beim Einreichen UND bei der Freigabe Mitglied war -- dafuer muss
-- bekannt sein, wer wann in welcher Crew war. crew_memberships loescht beim
-- Austritt die Zeile, deshalb protokolliert dieser Trigger jede aktive
-- Mitgliedschaftsperiode (joined_at .. left_at).

create table public.crew_membership_history (
  history_id uuid primary key default gen_random_uuid(),
  crew_id    uuid not null references public.crews (crew_id) on delete cascade,
  driver_id  uuid not null references public.drivers (driver_id) on delete cascade,
  joined_at  timestamptz not null,
  left_at    timestamptz,
  constraint crew_membership_history_period check (left_at is null or left_at >= joined_at)
);
-- at most one open period per driver (one crew per driver, DEC-0066)
create unique index crew_membership_history_open_idx on public.crew_membership_history (driver_id) where left_at is null;
create index crew_membership_history_crew_idx on public.crew_membership_history (crew_id);
comment on table public.crew_membership_history is
  'Active membership periods (RS-0025), written only by trigger on crew_memberships. Basis for crew points (DEC-0067).';

alter table public.crew_membership_history enable row level security;
create policy crew_membership_history_select on public.crew_membership_history
  for select using (driver_id = public.current_driver_id() or public.is_moderator());
grant select on public.crew_membership_history to authenticated;

create or replace function public.crew_memberships_log_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- close the period that ends
  if tg_op in ('UPDATE','DELETE') and old.status = 'active'
     and (tg_op = 'DELETE' or new.status <> 'active' or new.crew_id <> old.crew_id) then
    update public.crew_membership_history
       set left_at = now()
     where driver_id = old.driver_id and crew_id = old.crew_id and left_at is null;
  end if;
  -- open a new period
  if tg_op in ('INSERT','UPDATE') and new.status = 'active'
     and not (tg_op = 'UPDATE' and old.status = 'active' and old.crew_id = new.crew_id) then
    insert into public.crew_membership_history (crew_id, driver_id, joined_at)
    values (new.crew_id, new.driver_id, coalesce(new.decided_at, now()));
  end if;
  return null;
end;
$$;
revoke execute on function public.crew_memberships_log_history() from public, anon, authenticated;
create trigger crew_memberships_log_history
  after insert or update or delete on public.crew_memberships
  for each row execute function public.crew_memberships_log_history();

-- backfill memberships that are already active
insert into public.crew_membership_history (crew_id, driver_id, joined_at)
select crew_id, driver_id, coalesce(decided_at, requested_at)
from public.crew_memberships where status = 'active';
