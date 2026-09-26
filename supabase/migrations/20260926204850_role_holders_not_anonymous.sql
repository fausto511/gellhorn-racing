-- RS-0036 (2026-09-26, DEC-0078): crew leaders and event hosts cannot be
-- anonymous -- nobody can lead a crew or host an event without being known.
--   * granting a role (hub_roles insert) turns anonymity off for that driver
--   * a role holder cannot switch hide_display_name on
create or replace function public.driver_has_public_role(p_driver uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.hub_roles where driver_id = p_driver and role in ('crew_leader', 'event_host'));
$$;
revoke execute on function public.driver_has_public_role(uuid) from public, anon;
grant execute on function public.driver_has_public_role(uuid) to authenticated;

create or replace function public.drivers_block_anonymous_role_holder()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.hide_display_name and not coalesce(old.hide_display_name, false)
     and public.driver_has_public_role(new.driver_id) then
    raise exception 'role_requires_name: crew leaders and event hosts are always shown with their name'
      using errcode = '23514';
  end if;
  return new;
end $$;
revoke execute on function public.drivers_block_anonymous_role_holder() from public, anon, authenticated;
create trigger drivers_block_anonymous_role_holder
  before update of hide_display_name on public.drivers
  for each row execute function public.drivers_block_anonymous_role_holder();

create or replace function public.hub_roles_unhide_holder()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role in ('crew_leader', 'event_host') then
    update public.drivers set hide_display_name = false
     where driver_id = new.driver_id and hide_display_name;
  end if;
  return new;
end $$;
revoke execute on function public.hub_roles_unhide_holder() from public, anon, authenticated;
create trigger hub_roles_unhide_holder
  after insert on public.hub_roles
  for each row execute function public.hub_roles_unhide_holder();
