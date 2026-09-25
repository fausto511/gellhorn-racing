// The Hub (DEC-0062) -- shared types, sample data and markup renderers for
// the crew directory and the event calendar.
//
// One renderer per item type, used twice: at build time (sample rows,
// injected via set:html so the static page is never empty) and at runtime
// (live rows from Supabase replace the samples as soon as at least one real
// published row exists). Same pattern as Leaderboard.astro, but with a
// single source of markup so build-time and live rows can't drift apart.
//
// SAMPLE DATA IS FICTIONAL. Every sample crew and event below is invented
// for layout purposes only (explicitly allowed by Fausto, 2026-09-25) and is
// always shown with a visible "Sample data" flag. Replace by publishing real
// rows in the `crews` / `hub_events` tables -- not by editing this file.

export type Platform = 'ps5' | 'xbox';
export type CrewFocus = 'racing' | 'time-attack' | 'league' | 'drift' | 'car-meet' | 'cruise';
export type EventType = 'race' | 'time-attack' | 'league' | 'car-meet' | 'cruise' | 'other';

export interface HubCrew {
  slug: string;
  name: string;
  tag: string;
  color: string;
  platforms: Platform[];
  focus: CrewFocus[];
  region: string | null;
  language: string | null;
  description: string | null;
  member_count: number | null;
  discord_url: string | null;
  social_club_url: string | null;
  is_partner: boolean;
}

export interface HubEvent {
  event_id: string;
  title: string;
  event_type: EventType;
  starts_at: string; // ISO, UTC
  ends_at: string | null;
  platforms: Platform[];
  host_name: string | null;
  location: string | null;
  description: string | null;
  join_url: string | null;
  status: 'scheduled' | 'cancelled';
  host?: { name: string; tag: string; color: string } | null;
}

export const platformLabels: Record<Platform, string> = { ps5: 'PS5', xbox: 'Xbox Series X|S' };
export const platformShort: Record<Platform, string> = { ps5: 'PS5', xbox: 'XBOX' };
export const focusLabels: Record<CrewFocus, string> = {
  racing: 'Racing',
  'time-attack': 'Time Attack',
  league: 'League',
  drift: 'Drift',
  'car-meet': 'Car Meets',
  cruise: 'Cruises',
};
export const eventTypeLabels: Record<EventType, string> = {
  race: 'Race',
  'time-attack': 'Time Attack',
  league: 'League',
  'car-meet': 'Car Meet',
  cruise: 'Cruise',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Sample data (fictional)
// ---------------------------------------------------------------------------
export const sampleCrews: HubCrew[] = [
  { slug: 'sample-apex-syndicate', name: 'Apex Syndicate', tag: 'APX', color: '#ed253d', platforms: ['ps5'], focus: ['racing', 'league'], region: 'Europe', language: 'English', description: 'Clean, competitive circuit racing with weekly league nights. Sample entry.', member_count: 142, discord_url: null, social_club_url: null, is_partner: true },
  { slug: 'sample-vice-drift-union', name: 'Vice Drift Union', tag: 'VDU', color: '#ff7ab6', platforms: ['ps5', 'xbox'], focus: ['drift', 'car-meet'], region: 'North America', language: 'English', description: 'Tandem drift sessions and themed car meets. Sample entry.', member_count: 88, discord_url: null, social_club_url: null, is_partner: false },
  { slug: 'sample-leonida-lap-club', name: 'Leonida Lap Club', tag: 'LLC', color: '#ffd74c', platforms: ['xbox'], focus: ['time-attack', 'racing'], region: 'Worldwide', language: 'English', description: 'Hotlap hunters chasing tenths on every board. Sample entry.', member_count: 37, discord_url: null, social_club_url: null, is_partner: false },
  { slug: 'sample-nordring-crew', name: 'Nordring Crew', tag: 'NRC', color: '#3fa7ff', platforms: ['ps5'], focus: ['racing', 'cruise'], region: 'Europe', language: 'German', description: 'German-speaking racing crew with relaxed Sunday cruises. Sample entry.', member_count: 64, discord_url: null, social_club_url: null, is_partner: false },
  { slug: 'sample-gulf-coast-racing', name: 'Gulf Coast Racing', tag: 'GCR', color: '#27c281', platforms: ['ps5', 'xbox'], focus: ['league'], region: 'North America', language: 'English', description: 'Season-based league with fixed grids and stewarding. Sample entry.', member_count: 210, discord_url: null, social_club_url: null, is_partner: false },
  { slug: 'sample-midnight-meet', name: 'Midnight Meet', tag: 'MNM', color: '#9b6bff', platforms: ['ps5'], focus: ['car-meet', 'cruise'], region: 'Europe', language: 'English', description: 'Late-night meets, photo spots and convoy cruises. Sample entry.', member_count: 51, discord_url: null, social_club_url: null, is_partner: false },
];

const sampleHost = (slug: string) => {
  const c = sampleCrews.find((x) => x.slug === slug)!;
  return { name: c.name, tag: c.tag, color: c.color };
};

// Dated after the GTA VI release (2026-11-19) on purpose.
export const sampleEvents: HubEvent[] = [
  { event_id: 's1', title: 'Launch Night Grid Run', event_type: 'race', starts_at: '2026-11-21T19:00:00Z', ends_at: '2026-11-21T21:00:00Z', platforms: ['ps5'], host_name: null, location: 'Vice City Downtown', description: 'Open lobby, clean racing, stock vehicles. Sample event.', join_url: null, status: 'scheduled', host: sampleHost('sample-apex-syndicate') },
  { event_id: 's2', title: 'Ocean Drive Car Meet', event_type: 'car-meet', starts_at: '2026-11-22T20:30:00Z', ends_at: null, platforms: ['ps5', 'xbox'], host_name: null, location: 'Vice Beach', description: 'Bring your best build. Photo session at sunset. Sample event.', join_url: null, status: 'scheduled', host: sampleHost('sample-midnight-meet') },
  { event_id: 's3', title: 'Gellhorn Hotlap Session', event_type: 'time-attack', starts_at: '2026-11-25T18:00:00Z', ends_at: '2026-11-25T20:00:00Z', platforms: ['xbox'], host_name: null, location: 'Gellhorn International Raceway', description: 'Group hotlapping, times submitted to Time Attack afterwards. Sample event.', join_url: null, status: 'scheduled', host: sampleHost('sample-leonida-lap-club') },
  { event_id: 's4', title: 'Season 1 — Round 1', event_type: 'league', starts_at: '2026-11-28T19:30:00Z', ends_at: null, platforms: ['ps5', 'xbox'], host_name: null, location: null, description: 'Qualifying plus two races. Registration required. Sample event.', join_url: null, status: 'scheduled', host: sampleHost('sample-gulf-coast-racing') },
  { event_id: 's5', title: 'Everglades Sunday Cruise', event_type: 'cruise', starts_at: '2026-11-29T16:00:00Z', ends_at: null, platforms: ['ps5'], host_name: null, location: 'Leonida Keys', description: 'Slow convoy, no racing. Sample event.', join_url: null, status: 'cancelled', host: sampleHost('sample-nordring-crew') },
  { event_id: 's6', title: 'Community Drift Jam', event_type: 'other', starts_at: '2026-12-05T21:00:00Z', ends_at: null, platforms: ['ps5', 'xbox'], host_name: 'Open community event', location: 'Port Gellhorn', description: 'Free-for-all drift session. Sample event.', join_url: null, status: 'scheduled', host: null },
];

// ---------------------------------------------------------------------------
// Rendering (shared by build time and runtime)
// ---------------------------------------------------------------------------
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const safeColor = (c: string) => (/^#[0-9a-fA-F]{6}$/.test(c) ? c : '#a0a0c6');
const safeUrl = (u: string | null) => (u && /^https:\/\//.test(u) ? u : null);

/** Social-Club-style crew tag: white plate, black tag, thin crew-colour bar at the bottom. */
export function crewTagHtml(tag: string, color: string, size: 'sm' | 'md' = 'md'): string {
  return `<span class="crew-tag crew-tag-${size}" style="--crew-color:${safeColor(color)}" title="Crew tag ${esc(tag)}">${esc(tag)}</span>`;
}

/** Generic crew emblem (no crew logos, DEC-0062 / 25.09.) -- tinted with the crew colour. */
export function crewEmblemHtml(color: string): string {
  return `<span class="crew-emblem" style="--crew-color:${safeColor(color)}" aria-hidden="true"><svg viewBox="0 0 48 48" width="48" height="48"><path d="M24 3 42 9v14c0 11-7.6 19.2-18 22C13.6 42.2 6 34 6 23V9z" fill="var(--crew-color)"/><path d="M24 3 42 9v14c0 11-7.6 19.2-18 22z" fill="rgba(0,0,0,.18)"/><path d="M14 30 24 14l10 16h-6l-4-6.4-4 6.4z" fill="#14141a"/></svg></span>`;
}

const iconUsers = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
const iconPin = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
const iconClock = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

export function crewCardHtml(c: HubCrew): string {
  const discord = safeUrl(c.discord_url);
  const sc = safeUrl(c.social_club_url);
  const meta = [c.region, c.language].filter(Boolean).map(esc).join(' · ');
  return `<article class="crew-card" data-platforms="${esc(c.platforms.join('|'))}" data-focus="${esc(c.focus.join('|'))}" data-search="${esc(`${c.name} ${c.tag}`.toLowerCase())}" style="--crew-color:${safeColor(c.color)}">
  <div class="crew-card-head">
    ${crewEmblemHtml(c.color)}
    <div class="crew-card-id">
      <h3 class="crew-name">${esc(c.name)}${c.is_partner ? ' <span class="crew-partner">Partner</span>' : ''}</h3>
      ${c.member_count != null ? `<p class="crew-members">${iconUsers}${esc(c.member_count)} Members</p>` : ''}
      ${crewTagHtml(c.tag, c.color)}
    </div>
  </div>
  ${c.description ? `<p class="crew-desc">${esc(c.description)}</p>` : ''}
  <div class="crew-chips">
    ${c.platforms.map((p) => `<span class="chip chip-platform">${esc(platformShort[p] ?? p)}</span>`).join('')}
    ${c.focus.map((f) => `<span class="chip">${esc(focusLabels[f] ?? f)}</span>`).join('')}
  </div>
  <div class="crew-foot">
    <span class="crew-meta">${meta}</span>
    <span class="crew-links">
      ${sc ? `<a class="crew-link" href="${esc(sc)}" target="_blank" rel="noopener">Social Club</a>` : ''}
      ${discord ? `<a class="crew-link crew-link-discord" href="${esc(discord)}" target="_blank" rel="noopener">Discord</a>` : ''}
    </span>
  </div>
</article>`;
}

// Build time renders these in UTC (the server has no idea where the visitor
// is); the runtime script re-formats every [data-ts] element into the
// visitor's local time zone right after load.
export function eventRowHtml(e: HubEvent): string {
  const start = new Date(e.starts_at);
  const end = e.ends_at ? new Date(e.ends_at) : null;
  const day = start.toLocaleDateString('en-GB', { day: '2-digit', timeZone: 'UTC' });
  const mon = start.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
  const wd = start.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
  const time = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  const endTime = end ? end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '';
  const join = safeUrl(e.join_url);
  const cancelled = e.status === 'cancelled';
  const host = e.host
    ? `<span class="ev-host">${crewTagHtml(e.host.tag, e.host.color, 'sm')}<span>${esc(e.host.name)}</span></span>`
    : e.host_name ? `<span class="ev-host"><span>${esc(e.host_name)}</span></span>` : '';
  return `<article class="ev-row${cancelled ? ' is-cancelled' : ''}" data-type="${esc(e.event_type)}" data-platforms="${esc(e.platforms.join('|'))}" data-start="${esc(e.starts_at)}">
  <div class="ev-date" data-ts="${esc(e.starts_at)}">
    <span class="ev-wd" data-fmt="wd">${esc(wd)}</span>
    <span class="ev-day" data-fmt="day">${esc(day)}</span>
    <span class="ev-mon" data-fmt="mon">${esc(mon)}</span>
  </div>
  <div class="ev-main">
    <div class="ev-top">
      <span class="chip chip-type chip-${esc(e.event_type)}">${esc(eventTypeLabels[e.event_type] ?? e.event_type)}</span>
      ${cancelled ? '<span class="chip chip-cancelled">Cancelled</span>' : ''}
      ${e.platforms.map((p) => `<span class="chip chip-platform">${esc(platformShort[p] ?? p)}</span>`).join('')}
    </div>
    <h3 class="ev-title">${esc(e.title)}</h3>
    <p class="ev-facts">
      <span class="ev-time">${iconClock}<span data-ts="${esc(e.starts_at)}" data-fmt="time">${esc(time)}</span>${end ? `–<span data-ts="${esc(e.ends_at)}" data-fmt="time">${esc(endTime)}</span>` : ''} <span class="ev-tz" data-tz="${esc(e.starts_at)}">UTC</span></span>
      ${e.location ? `<span class="ev-loc">${iconPin}${esc(e.location)}</span>` : ''}
    </p>
    ${e.description ? `<p class="ev-desc">${esc(e.description)}</p>` : ''}
  </div>
  <div class="ev-side">
    ${host}
    ${join && !cancelled ? `<a class="btn btn-white-tonal ev-join" href="${esc(join)}" target="_blank" rel="noopener">Details</a>` : ''}
  </div>
</article>`;
}

/** Re-formats all [data-ts] nodes inside `root` into the visitor's local time. */
export function localizeTimes(root: ParentNode): void {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  root.querySelectorAll<HTMLElement>('[data-ts]').forEach((el) => {
    const d = new Date(el.dataset.ts!);
    if (Number.isNaN(d.getTime())) return;
    const fmt = el.dataset.fmt;
    if (fmt === 'time') { el.textContent = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); return; }
    el.querySelectorAll<HTMLElement>('[data-fmt]').forEach((part) => {
      if (part.dataset.fmt === 'wd') part.textContent = d.toLocaleDateString('en-GB', { weekday: 'short' });
      if (part.dataset.fmt === 'day') part.textContent = d.toLocaleDateString('en-GB', { day: '2-digit' });
      if (part.dataset.fmt === 'mon') part.textContent = d.toLocaleDateString('en-GB', { month: 'short' });
    });
  });
  // Zone abbreviation per event date, not per today -- an event in winter
  // must show CET, not the CEST that applies while the page is viewed.
  root.querySelectorAll<HTMLElement>('[data-tz]').forEach((el) => {
    const at = new Date(el.dataset.tz!);
    const short = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).formatToParts(Number.isNaN(at.getTime()) ? new Date() : at).find((p) => p.type === 'timeZoneName')?.value;
    el.textContent = short ?? tz;
    el.title = `Shown in your local time (${tz})`;
  });
}

/** Month heading key, e.g. "2026-11" -> "November 2026" (local time). */
export function monthLabel(iso: string, utc = false): string {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', ...(utc ? { timeZone: 'UTC' } : {}) });
}
