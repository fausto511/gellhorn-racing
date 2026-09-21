-- Lets a moderator write their own moderation_log entry for a direct
-- runs/evidence edit made from the Moderator Override form on /moderator/
-- (raw field corrections + free status changes), bypassing the
-- moderate-submission Edge Function. Only the Edge Function's service-role
-- client could write to moderation_log before this; there was no way for a
-- moderator's own browser session to log anything, so a direct edit left
-- no trace at all.
--
-- This is deliberately narrower than "any moderator can insert any log
-- row": moderator_driver_id must match the caller's own drivers row
-- (resolved server-side from auth.uid(), not trusted from the client), so
-- a moderator cannot attribute an entry to someone else.
--
-- Not atomic with the runs/evidence update it follows (two separate client
-- calls) — accepted trade-off for now to avoid a moderate-submission
-- redeploy. If that ever needs to be a hard guarantee, move this into a
-- new Edge Function action instead (service role, single request).

create policy moderation_log_moderator_insert_own on public.moderation_log
  for insert
  with check (
    is_moderator()
    and moderator_driver_id = (
      select driver_id from public.drivers where auth_user_id = auth.uid()
    )
  );

grant insert on public.moderation_log to authenticated;
