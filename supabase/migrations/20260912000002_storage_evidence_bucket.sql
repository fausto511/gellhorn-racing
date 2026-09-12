-- Private storage bucket for lap-evidence screenshots.
--
-- Spec 8.3 / product rule: screenshots are private, time-limited review
-- evidence, never served publicly. This bucket is created non-public, and
-- objects are addressed by a per-driver folder prefix
-- (`<auth.uid()>/<filename>`, matching the upload path the submit-lap
-- reference page uses) so RLS can restrict access without a lookup table.
--
-- Moderators reach files only through the moderate-submission Edge
-- Function's issue_signed_url action (service role, short-lived signed
-- URL) — not through a standing SELECT grant here — which is the
-- literal DEC-0045 "befristete Signed-URL-Ausgabe für private Belege".

insert into storage.buckets (id, name, public, file_size_limit)
values ('lap-evidence', 'lap-evidence', false, 8 * 1024 * 1024)
on conflict (id) do nothing;

-- Owner can upload into their own folder only.
create policy lap_evidence_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'lap-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can read back their own uploaded files (e.g. to confirm an upload
-- before submitting). No public/anon policy exists on this bucket at all.
create policy lap_evidence_owner_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'lap-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- No update/delete policy for clients: retention (delete_after in
-- public.evidence) is handled by a moderation/cleanup process, not exposed
-- to drivers directly in v0.
