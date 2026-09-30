// Live data for The Hub. Returns null whenever live data isn't usable
// (no backend config, table missing because the migration hasn't run yet,
// network/RLS error, or simply zero published rows) -- callers then keep
// showing the flagged sample data. Never throws.
import { backendConfigured, getSupabase } from './supabase-client';
import type { HubCrew, HubEvent } from '../data/hub';

export async function fetchLiveCrews(): Promise<HubCrew[] | null> {
  if (!backendConfigured) return null;
  try {
    const { data, error } = await getSupabase()
      .from('crews')
      .select('crew_id,slug,name,tag,color,platforms,focus,region,languages,description,member_count,discord_url,social_club_url,is_partner')
      .eq('is_published', true)
      .order('is_partner', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error || !data || data.length === 0) return null;
    return data as HubCrew[];
  } catch {
    return null;
  }
}

export async function fetchLiveEvents(): Promise<HubEvent[] | null> {
  if (!backendConfigured) return null;
  try {
    // Keep events visible for a few hours after they started (still
    // running / just finished) before they drop off the upcoming list.
    const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
    const { data, error } = await getSupabase()
      .from('hub_events')
      .select('event_id,title,event_type,starts_at,ends_at,platforms,host_name,location,description,join_url,discord_url,status,max_participants,created_by,host:crews(name,tag,color,discord_url)')
      .eq('is_published', true)
      .gte('starts_at', since)
      .order('starts_at', { ascending: true })
      .limit(200);
    if (error || !data || data.length === 0) return null;
    // "Hosted by" fallback (DEC-0077): the creator's site display name when no
    // PSN name is given. public_drivers hides anonymised drivers.
    const rows = data as unknown as (HubEvent & { created_by?: string | null })[];
    const ids = [...new Set(rows.filter((r) => !r.host_name && r.created_by).map((r) => r.created_by as string))];
    if (ids.length) {
      const { data: names } = await getSupabase().from('public_drivers').select('driver_id, display_name').in('driver_id', ids);
      const byId = new Map(((names ?? []) as { driver_id: string; display_name: string | null }[]).map((n) => [n.driver_id, n.display_name]));
      rows.forEach((r) => { if (!r.host_name && r.created_by) r.host_account = byId.get(r.created_by) ?? null; });
    }
    return rows;
  } catch {
    return null;
  }
}

/** Public roster (active members of published crews, anonymised drivers
 *  excluded by the view). crew_id -> display names, alphabetical. */
export async function fetchRoster(): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (!backendConfigured) return out;
  try {
    const { data, error } = await getSupabase().from('public_crew_roster').select('crew_id,display_name').order('display_name');
    if (error || !data) return out;
    for (const r of data as { crew_id: string; display_name: string }[]) {
      if (!out.has(r.crew_id)) out.set(r.crew_id, []);
      out.get(r.crew_id)!.push(r.display_name);
    }
  } catch { /* keep empty */ }
  return out;
}
