// Shared Supabase client singleton.
//
// Every page here is a separate Astro document with its own inline
// <script>, and Header.astro (global layout) adds one more of those on top
// of every page. Until 2026-09-24 each of those scripts called
// createClient() independently -- Header.astro had its own, and every page
// had its own local getSupabase() -- so a page like /account/ ran TWO
// separate GoTrueClient instances side by side, both reading/writing the
// same localStorage auth-token key (Supabase warns about exactly this:
// "Multiple GoTrueClient instances detected in the same browser context").
//
// That's not just noise: on the page a Discord OAuth redirect lands back
// on, both instances try to detect and consume the same callback URL
// (`detectSessionInUrl`, on by default), and only one of them ends up
// reflecting the resulting session in its own in-memory state. Whichever
// one loses that race -- often Header.astro's, since that's what drives the
// visible avatar/login-button state -- shows the driver as still logged
// out even though the session was actually created. That's what broke the
// "Login with Discord" flow.
//
// Fix: one shared module-level singleton, imported by Header.astro and
// every page's own script instead of each calling createClient() itself.
// Vite/Astro extracts a module imported from multiple entry scripts into
// one shared chunk, and the browser's native ES-module loader caches a
// given module URL exactly once per page -- so this really is one instance
// per page load, not one per importer.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';
export const backendConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}
