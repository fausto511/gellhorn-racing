#!/usr/bin/env node
// Fetches the public Supabase views (public_leaderboard,
// public_vehicles_needed) over PostgREST and writes them to a JSON snapshot
// consumed at Astro build time, so /time-attack/ and the Gellhorn track page
// ship real current data as static HTML (DEC-0045: no pure client-side-only
// data loading for those two SEO-critical pages).
//
// Both views expose ONLY the fields spec 6.4 confirms as public — no
// auth_subject/discord_user_id, no private evidence, no screenshot content.
//
// Graceful no-op by design: until SUPABASE_URL/SUPABASE_ANON_KEY exist as
// repository secrets (no real Supabase project has been created yet), this
// script exits 0 without writing anything, so the scheduled workflow does
// not fail red every 15-30 minutes for a decision that's still pending.

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const OUT_PATH = process.env.SNAPSHOT_OUT_PATH ?? "site/src/data/leaderboard-snapshot.json";

async function fetchView(name) {
  const url = `${SUPABASE_URL}/rest/v1/${name}?select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`fetching ${name} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log(
      "SUPABASE_URL / SUPABASE_ANON_KEY not set — no Supabase project exists yet. " +
        "Skipping snapshot fetch (graceful no-op, not a failure).",
    );
    return;
  }

  const [leaderboard, vehiclesNeeded] = await Promise.all([
    fetchView("public_leaderboard"),
    fetchView("public_vehicles_needed"),
  ]);

  const snapshot = {
    generated_at: new Date().toISOString(),
    leaderboard,
    vehicles_needed: vehiclesNeeded,
  };

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  console.log(`Wrote ${leaderboard.length} leaderboard rows and ${vehiclesNeeded.length} needed-vehicle rows to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
