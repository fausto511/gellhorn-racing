// submit-lap — one of the two mandatory Supabase Edge Functions from
// DEC-0045. Authenticated (Discord OAuth via Supabase Auth). Validates a
// driver's lap submission server-side (RLS alone is not enough per
// DEC-0045: "RLS bleibt zusätzliche, nicht alleinige Schutzschicht"),
// applies the v0 auto-publication rule (spec 6.1), and records field
// provenance (spec 8.5).
//
// OCR is intentionally NOT wired to a real vision model here. Two reasons,
// both from project decisions the user has stood by, not an implementation
// shortcut:
//   1. RS-0005: no paid OCR/vision-model call may run without the user's
//      new, explicit, prior cost approval and a fixed spending limit.
//   2. GTA VI has not launched yet, so there is no real HUD screenshot to
//      calibrate an OCR prompt/schema against (the Gridkeeper benchmark
//      numbers this repo has are from GTA V test material, not GTA VI).
// `runOcr()` below is a clearly-marked, inert placeholder. Until a human
// wires up a real provider and flips ENABLE_OCR, submissions must carry
// vehicle_id and lap_time_ms entered directly by the driver (who is reading
// their own screenshot) — evidence.type='screenshot' still gets uploaded and
// stored for moderator review either way.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PLATFORMS = ["ps5", "xbox_series"] as const;
type Platform = (typeof PLATFORMS)[number];

// Simple fixed-window rate limit: at most this many submissions per driver
// per window. Deliberately conservative for v0; revisit once real traffic
// exists.
const RATE_LIMIT_MAX_SUBMISSIONS = 20;
const RATE_LIMIT_WINDOW_MINUTES = 60;

interface EvidenceInput {
  type: "screenshot" | "video_link";
  storage_reference: string; // storage path for screenshot, or a YouTube URL for video_link
  sha256?: string;
  mime_type?: string;
  byte_size?: number;
}

interface SubmitLapBody {
  track_id: string;
  vehicle_id: string;
  vehicle_text_observed?: string;
  lap_time_ms: number;
  platform: Platform;
  standard_version: string;
  conditions?: Record<string, unknown>;
  game_version?: string;
  display_name_consent: boolean;
  evidence: EvidenceInput[];
}

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

// Inert OCR placeholder — see file header. Never called unless ENABLE_OCR is
// explicitly set, and even then it refuses to run without a wired provider,
// so flipping the env var alone can never trigger a real paid model call.
async function runOcr(_evidence: EvidenceInput): Promise<null> {
  if (Deno.env.get("ENABLE_OCR") !== "true") return null;
  throw new Error(
    "OCR is flagged on but no provider is wired up (RS-0005 cost-approval gate: " +
      "no paid vision-model call without new explicit user approval and a fixed " +
      "spending limit, and no real GTA VI HUD material exists yet to calibrate against).",
  );
}

function validateBody(body: Partial<SubmitLapBody>): string[] {
  const errors: string[] = [];
  if (!body.track_id) errors.push("track_id is required");
  if (!body.vehicle_id) errors.push("vehicle_id is required");
  if (!Number.isInteger(body.lap_time_ms) || (body.lap_time_ms ?? 0) <= 0) {
    errors.push("lap_time_ms must be a positive integer");
  }
  if (!body.platform || !PLATFORMS.includes(body.platform)) {
    errors.push(`platform must be one of: ${PLATFORMS.join(", ")}`);
  }
  if (!body.standard_version) errors.push("standard_version is required");
  if (body.display_name_consent !== true && body.display_name_consent !== false) {
    errors.push("display_name_consent must be a boolean");
  }
  if (!Array.isArray(body.evidence) || body.evidence.length === 0) {
    errors.push("at least one evidence item is required");
  } else {
    for (const [i, ev] of body.evidence.entries()) {
      if (!["screenshot", "video_link"].includes(ev.type)) {
        errors.push(`evidence[${i}].type must be screenshot or video_link`);
      }
      if (!ev.storage_reference) {
        errors.push(`evidence[${i}].storage_reference is required`);
      }
    }
  }
  return errors;
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

  // User-scoped client: honors RLS, used to confirm identity.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return jsonResponse({ error: "invalid session" }, 401);

  // Service-role client: this function IS the server-side re-verification
  // layer DEC-0045 requires beyond RLS (rate limiting, cross-row duplicate
  // checks, and the auto-publication rule all need to see more than the
  // submitting driver's own rows).
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const driverId = await getDriverId(admin, userData.user.id);
  if (!driverId) return jsonResponse({ error: "no active driver profile for this account" }, 403);

  let body: Partial<SubmitLapBody>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid JSON body" }, 400);
  }

  const validationErrors = validateBody(body);
  if (validationErrors.length > 0) {
    return jsonResponse({ error: "validation_failed", details: validationErrors }, 422);
  }
  const input = body as SubmitLapBody;

  // Rate limit (spec 9 "Uploadlimits", DEC-0045 abuse concerns).
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000).toISOString();
  const { count: recentCount, error: countErr } = await admin
    .from("runs")
    .select("run_id", { count: "exact", head: true })
    .eq("driver_id", driverId)
    .gte("created_at", windowStart);
  if (countErr) return jsonResponse({ error: "rate limit check failed" }, 500);
  if ((recentCount ?? 0) >= RATE_LIMIT_MAX_SUBMISSIONS) {
    return jsonResponse({ error: "rate_limited", retry_after_minutes: RATE_LIMIT_WINDOW_MINUTES }, 429);
  }

  // Confirm the vehicle/track exist (defense in depth beyond the FK, so we
  // can return a clean 422 instead of a raw DB error).
  const { data: vehicle } = await admin
    .from("vehicles")
    .select("vehicle_id")
    .eq("vehicle_id", input.vehicle_id)
    .maybeSingle();
  if (!vehicle) return jsonResponse({ error: "unknown vehicle_id" }, 422);
  const { data: track } = await admin
    .from("tracks")
    .select("track_id")
    .eq("track_id", input.track_id)
    .maybeSingle();
  if (!track) return jsonResponse({ error: "unknown track_id" }, 422);

  // OCR is a no-op today (see file header) — kept as an explicit step so the
  // pipeline shape (submit -> maybe-OCR -> store observed + confirmed value
  // with provenance) is already correct once a provider is wired up.
  const ocrResult = await runOcr(input.evidence[0]);

  const hasPublicVideo = input.evidence.some((e) => e.type === "video_link");
  // 6.1: a screenshot-backed run may auto-publish as provisional/unverified
  // once basic validation passes and the driver consented to publishing
  // their display_name. A video-only or video+screenshot submission with no
  // prior moderator review sits as video_submitted until a human checks the
  // full, uncut lap (5.3) — it must NOT jump to verified/official here.
  const reviewStatus = "submitted";
  const publicationStatus = input.display_name_consent ? "provisional" : "hidden";
  const verificationTier = hasPublicVideo ? "video_submitted" : "unverified";

  const { data: run, error: runErr } = await admin
    .from("runs")
    .insert({
      driver_id: driverId,
      track_id: input.track_id,
      vehicle_id: input.vehicle_id,
      vehicle_text_observed: ocrResult ?? input.vehicle_text_observed ?? null,
      lap_time_ms: input.lap_time_ms,
      platform: input.platform,
      standard_version: input.standard_version,
      conditions: input.conditions ?? {},
      game_version: input.game_version ?? null,
      review_status: reviewStatus,
      publication_status: publicationStatus,
      verification_tier: verificationTier,
      display_name_consent: input.display_name_consent,
      submitted_at: new Date().toISOString(),
    })
    .select("run_id")
    .single();

  if (runErr || !run) {
    return jsonResponse({ error: "failed to create run", details: runErr?.message }, 500);
  }

  const evidenceRows = input.evidence.map((ev) => ({
    run_id: run.run_id,
    type: ev.type,
    role: ev.type === "screenshot" ? "private_original" : "external_video",
    visibility: ev.type === "screenshot" ? "private" : "public",
    storage_reference: ev.storage_reference,
    sha256: ev.sha256 ?? null,
    mime_type: ev.mime_type ?? null,
    byte_size: ev.byte_size ?? null,
  }));
  const { error: evidenceErr } = await admin.from("evidence").insert(evidenceRows);
  if (evidenceErr) {
    // Best-effort rollback of the run so a failed evidence write doesn't
    // leave an orphaned, evidence-less submission behind.
    await admin.from("runs").delete().eq("run_id", run.run_id);
    return jsonResponse({ error: "failed to store evidence", details: evidenceErr.message }, 500);
  }

  const provenanceRows = [
    {
      entity_type: "run",
      entity_id: run.run_id,
      field_name: "lap_time_ms",
      source: "user",
      confirmed_value: input.lap_time_ms,
      actor: driverId,
    },
    {
      entity_type: "run",
      entity_id: run.run_id,
      field_name: "vehicle_id",
      source: ocrResult ? "ocr" : "user",
      observed_value: ocrResult ?? input.vehicle_text_observed ?? null,
      confirmed_value: input.vehicle_id,
      actor: driverId,
    },
  ];
  await admin.from("field_provenance").insert(provenanceRows);

  return jsonResponse({
    run_id: run.run_id,
    review_status: reviewStatus,
    publication_status: publicationStatus,
    verification_tier: verificationTier,
  }, 201);
});
