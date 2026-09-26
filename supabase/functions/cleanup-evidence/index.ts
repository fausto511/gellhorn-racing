// cleanup-evidence (RS-0028, DEC-0070) — deletes screenshot files whose
// retention has run out (60 days; the current best time of every vehicle on
// every track is kept). Called every 30 days by pg_cron via pg_net with a
// secret job token (private.job_tokens); no user session involved, so the
// function is deployed with verify_jwt = false and checks the token itself.
//
// The lap times stay; only the image file is removed and the evidence row is
// marked retention_state = 'deleted'.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EVIDENCE_BUCKET = "lap-evidence";
const RETENTION_DAYS = 60;
const BATCH = 100;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const token = req.headers.get("x-job-token") ?? "";
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: ok, error: tokErr } = await admin.rpc("check_job_token", { p_name: "cleanup-evidence", p_token: token });
  if (tokErr || ok !== true) return json({ error: "forbidden" }, 403);

  const { data: due, error: dueErr } = await admin.rpc("evidence_due_for_deletion", { p_days: RETENTION_DAYS });
  if (dueErr) return json({ error: dueErr.message }, 500);
  const rows = (due ?? []) as { evidence_id: string; storage_reference: string }[];

  let deleted = 0;
  const failed: string[] = [];
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error: rmErr } = await admin.storage.from(EVIDENCE_BUCKET).remove(chunk.map((r) => r.storage_reference));
    if (rmErr) { failed.push(...chunk.map((r) => r.evidence_id)); continue; }
    const { error: upErr } = await admin
      .from("evidence")
      .update({ retention_state: "deleted", delete_after: new Date().toISOString() })
      .in("evidence_id", chunk.map((r) => r.evidence_id));
    if (upErr) failed.push(...chunk.map((r) => r.evidence_id));
    else deleted += chunk.length;
  }
  return json({ checked_at: new Date().toISOString(), due: rows.length, deleted, failed: failed.length });
});
