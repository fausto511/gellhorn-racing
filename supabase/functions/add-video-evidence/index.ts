// add-video-evidence — lets a driver attach a video link to an existing
// run of theirs after the fact (screenshot-only submission, video added
// later). Companion to submit-lap/withdraw-run: same auth pattern
// (Discord-authenticated user, re-verified server-side with a
// service-role client per DEC-0045 -- RLS alone is not the only layer).
//
// Why this needs its own function rather than a direct client update:
// runs_update_own_before_review (RLS) only lets a driver touch their own
// run while review_status is draft/needs_correction. Once a run has been
// submitted (let alone already looked at by a moderator), the driver has
// no RLS path left to bump verification_tier themselves -- which would
// otherwise make "add video later" impossible for exactly the runs where
// a driver is most likely to want it (already submitted, sitting in the
// queue or already accepted as provisional).
//
// Scope: refuses once a run is 'rejected'/'invalidated' (disputing a
// rejection is a different, not-yet-built flow, not something video
// evidence should silently reopen) or already 'verified' (nothing to
// gain). Otherwise: insert the video_link evidence row, and if the run
// was still 'unverified', bump it to 'video_submitted' -- the same tier
// submit-lap itself would have assigned had the video been included from
// the start. review_status is left untouched on purpose: the moderator
// queue already includes 'accepted' runs in its own "Accepted" bucket
// (site/src/pages/moderator/index.astro), so the newly-video'd run stays
// visible there without needing a status reset.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

  let body: { run_id?: string; video_url?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid JSON body" }, 400);
  }
  const videoUrl = (body.video_url ?? "").trim();
  if (!body.run_id) return jsonResponse({ error: "run_id is required" }, 422);
  if (!videoUrl) return jsonResponse({ error: "video_url is required" }, 422);

  // Re-verify ownership and status server-side -- never trust the client
  // on either point, same rationale as submit-lap/withdraw-run (DEC-0045).
  const { data: run, error: runErr } = await admin
    .from("runs")
    .select("run_id, driver_id, review_status, verification_tier")
    .eq("run_id", body.run_id)
    .maybeSingle();
  if (runErr || !run) return jsonResponse({ error: "run not found" }, 404);
  if (run.driver_id !== driverId) return jsonResponse({ error: "not your submission" }, 403);
  if (run.review_status === "rejected" || run.review_status === "invalidated") {
    return jsonResponse(
      {
        error: "not_eligible",
        detail: "This submission was rejected/invalidated -- adding a video here won't reopen it.",
      },
      409,
    );
  }
  if (run.verification_tier === "verified") {
    return jsonResponse(
      { error: "already_verified", detail: "This run is already fully verified -- nothing to add." },
      409,
    );
  }

  const { error: evidenceErr } = await admin.from("evidence").insert({
    run_id: run.run_id,
    type: "video_link",
    role: "external_video",
    visibility: "public",
    storage_reference: videoUrl,
  });
  if (evidenceErr) {
    return jsonResponse({ error: "failed to store evidence", details: evidenceErr.message }, 500);
  }

  let newTier = run.verification_tier;
  if (run.verification_tier === "unverified") {
    newTier = "video_submitted";
    const { error: updateErr } = await admin
      .from("runs")
      .update({ verification_tier: newTier })
      .eq("run_id", run.run_id);
    if (updateErr) {
      return jsonResponse({ error: "video stored, but failed to update verification tier", details: updateErr.message }, 500);
    }
  }

  return jsonResponse({ added: true, run_id: run.run_id, verification_tier: newTier }, 200);
});
