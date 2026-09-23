// withdraw-run — lets a driver pull back their own screenshot submission
// before a moderator has looked at it. Companion to submit-lap: same auth
// pattern (Discord-authenticated user, re-verified server-side with a
// service-role client per DEC-0045 -- RLS alone is not the only layer).
//
// Deliberately scoped to publication_status = 'hidden' only. Once a
// moderator has accepted a run (publication_status moves past 'hidden'),
// this function refuses (409) -- a driver should not be able to make an
// already-reviewed, public time disappear unilaterally (e.g. right before
// a competition deadline). For an already-published run the driver's own
// path is the (separate, not-yet-built) anonymize feature: name removed,
// time stays.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EVIDENCE_BUCKET = "lap-evidence";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
}

async function getDriverId(supabase: SupabaseClient, authUserId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("drivers")
    .select("driver_id, deleted_at")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error || !data || data.deleted_at) return null;
  return data.driver_id as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "missing Authorization header" }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return jsonResponse({ error: "invalid session" }, 401);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const driverId = await getDriverId(admin, userData.user.id);
  if (!driverId) return jsonResponse({ error: "no active driver profile for this account" }, 403);

  let body: { run_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid JSON body" }, 400);
  }
  if (!body.run_id) return jsonResponse({ error: "run_id is required" }, 422);

  // Re-verify ownership and status server-side -- never trust the client
  // on either point, same rationale as submit-lap (DEC-0045).
  const { data: run, error: runErr } = await admin
    .from("runs")
    .select("run_id, driver_id, publication_status")
    .eq("run_id", body.run_id)
    .maybeSingle();
  if (runErr || !run) return jsonResponse({ error: "run not found" }, 404);
  if (run.driver_id !== driverId) return jsonResponse({ error: "not your submission" }, 403);
  if (run.publication_status !== "hidden") {
    return jsonResponse(
      {
        error: "already_reviewed",
        detail: "A moderator has already reviewed this submission -- it can no longer be withdrawn this way.",
      },
      409,
    );
  }

  // Clean up the actual screenshot file(s) before removing rows, so
  // nothing orphaned is left behind in the private evidence bucket.
  const { data: evidenceRows } = await admin
    .from("evidence")
    .select("storage_reference, type")
    .eq("run_id", run.run_id);

  const screenshotPaths = (evidenceRows ?? [])
    .filter((e) => e.type === "screenshot")
    .map((e) => e.storage_reference);
  if (screenshotPaths.length > 0) {
    await admin.storage.from(EVIDENCE_BUCKET).remove(screenshotPaths);
  }

  // field_provenance isn't a real FK (entity_type/entity_id is generic), so
  // it doesn't cascade -- clean it up explicitly. evidence itself does
  // cascade off runs.run_id (ON DELETE CASCADE), so no separate delete
  // needed there once the run row goes.
  await admin.from("field_provenance").delete().eq("entity_type", "run").eq("entity_id", run.run_id);

  const { error: deleteErr } = await admin.from("runs").delete().eq("run_id", run.run_id);
  if (deleteErr) {
    return jsonResponse({ error: "failed to withdraw run", details: deleteErr.message }, 500);
  }

  return jsonResponse({ withdrawn: true, run_id: run.run_id }, 200);
});
