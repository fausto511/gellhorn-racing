// join-discord-guild -- called right after a Discord login on our site to
// automatically add the driver to our own Discord server too, same pattern
// The Sim Grid uses (Fausto, 2026-09-24): request the extra `guilds.join`
// OAuth scope at login, then use the short-lived Discord access token that
// comes back to add the user server-side via our own bot.
//
// Auth pattern: same as withdraw-run/add-video-evidence (DEC-0045) --
// re-verify the caller's Supabase session server-side with a service-role
// client, never trust the client alone.
//
// Discord-specific catch: Supabase only exposes `session.provider_token`
// (the user's own Discord OAuth access token) right after the OAuth
// redirect completes (the SIGNED_IN event), not on later page loads/session
// refreshes -- so the frontend must call this function exactly then, and
// pass that token along, because we cannot fetch it again later ourselves.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN")!;
const DISCORD_GUILD_ID = Deno.env.get("DISCORD_GUILD_ID")!;

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

async function getDiscordUserId(admin: SupabaseClient, authUserId: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(authUserId);
  if (error || !data?.user) return null;
  const discordIdentity = data.user.identities?.find((i) => i.provider === "discord");
  const fromIdentity = (discordIdentity?.identity_data as { id?: string } | undefined)?.id ?? null;
  if (fromIdentity) return fromIdentity;
  // Fallback, in case identity_data.id is ever missing: user_metadata is
  // populated from the same Discord profile at signup/login time.
  const meta = data.user.user_metadata as { provider_id?: string; sub?: string } | undefined;
  return meta?.provider_id ?? meta?.sub ?? null;
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

  let body: { discord_access_token?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid JSON body" }, 400);
  }
  const discordAccessToken = body.discord_access_token;
  if (!discordAccessToken) return jsonResponse({ error: "discord_access_token is required" }, 422);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const discordUserId = await getDiscordUserId(admin, userData.user.id);
  if (!discordUserId) {
    return jsonResponse({ error: "could not resolve Discord user id for this account" }, 422);
  }

  const discordResp = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: discordAccessToken }),
    },
  );

  // 201: newly added. 204: was already a member -- both are success from
  // our side, nothing left to do either way.
  if (discordResp.status === 201) {
    return jsonResponse({ joined: true, already_member: false });
  }
  if (discordResp.status === 204) {
    return jsonResponse({ joined: true, already_member: true });
  }

  const detail = await discordResp.text();
  return jsonResponse(
    { error: "discord_api_error", status: discordResp.status, detail },
    502,
  );
});
