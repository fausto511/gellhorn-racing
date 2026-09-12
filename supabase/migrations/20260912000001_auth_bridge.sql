-- Bridges Supabase Auth (Discord OAuth) to public.drivers.
--
-- Spec 7: only the Discord OAuth `identify` scope is used; only a stable
-- Discord user id and Gellhorn's own profile fields (display_name) are kept
-- long-term. This trigger runs once per new auth.users row (i.e. once per
-- new Discord login) and creates the matching drivers row automatically, so
-- no client-side code ever needs service-role access to create it.
--
-- Reads new.raw_user_meta_data (populated on the auth.users row itself at
-- insert time by GoTrue), NOT a join to auth.identities: identities are
-- written in a separate statement within the same signup transaction, so an
-- AFTER INSERT ON auth.users trigger can run before that row is visible —
-- confirmed against a local Postgres instance while building this
-- migration. raw_user_meta_data is populated at the same INSERT this
-- trigger fires on, so it is reliably present.
--
-- The onboarding flow (spec 7.1) is expected to let the driver immediately
-- change the placeholder display_name this trigger assigns.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_provider text := new.raw_app_meta_data->>'provider';
  v_discord_id text;
  v_placeholder_name text;
begin
  if v_provider is distinct from 'discord' then
    -- v0 only offers Discord OAuth; skip provisioning rather than guess if
    -- another provider ever appears.
    return new;
  end if;

  v_discord_id := coalesce(v_meta->>'provider_id', v_meta->>'sub');
  v_placeholder_name := coalesce(
    v_meta->>'full_name',
    v_meta->>'name',
    v_meta->>'user_name',
    'Driver_' || substr(new.id::text, 1, 6)
  );

  if v_discord_id is null then
    raise exception 'handle_new_auth_user: no discord provider_id/sub in raw_user_meta_data for auth.users %', new.id;
  end if;

  insert into public.drivers (auth_user_id, discord_user_id, display_name)
  values (new.id, v_discord_id, v_placeholder_name)
  on conflict (auth_user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
