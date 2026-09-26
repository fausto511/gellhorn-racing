// Gellhorn leaderboard: data model, sample data and renderers (2026-09-26).
//
// One renderer for both worlds: the build renders the SAMPLE data (so the page
// looks right without JS), the browser re-renders the same way with either
// the sample data or -- as soon as at least one real run is published -- the
// live rows from public_leaderboard. Filters (Overall / Vehicle Records,
// driver + vehicle search, All times / Verified only) work on both.
//
// SAMPLE DATA IS FICTIONAL. Drivers, times and crew memberships are invented;
// only garage vehicles are used so every vehicle link resolves. Crews are the
// fictional sample crews of The Hub (data/hub.ts). Always shown with the
// visible "Sample data" flag.
import { vehicleOptions } from './vehicles';
import { sampleCrews, esc } from './hub';

export interface LbEntry {
  /** best run of one driver on one vehicle (= one row of public_leaderboard) */
  driver: string;
  driver_id: string;
  crew: { tag: string; color: string } | null;
  vehicle_id: string;
  make: string;
  model: string;
  logo: string | null; // manufacturer logo slug
  lap_time_ms: number;
  entries: number; // published laps of this driver on the track
  verified: boolean;
  video_url: string | null;
}

export type LbView = 'overall' | 'vehicles';
export interface LbState {
  view: LbView;
  vehicle: string | null; // vehicle_id when a single vehicle board is open
  qDriver: string;
  qVehicle: string;
  verifiedOnly: boolean;
  showAll: boolean;
}
export const initialState: LbState = { view: 'overall', vehicle: null, qDriver: '', qVehicle: '', verifiedOnly: false, showAll: false };
export const PAGE = 12;

// ---------------------------------------------------------------------------
// Sample data (fictional, deterministic)
// ---------------------------------------------------------------------------
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Garage vehicle + fictional base pace on Gellhorn (ms)
const SAMPLE_VEHICLES: [string, number][] = [
  ['grotti-furia', 84200], ['pegassi-zorrusso', 84500], ['truffade-thrax', 84900], ['pegassi-tempesta', 85300],
  ['grotti-itali-rsx', 85900], ['pfister-neon', 86500], ['bravado-banshee', 86800], ['invetero-coquette-d10', 87100],
  ['ubermacht-cypher', 87500], ['annis-elegy-retro-custom', 87900], ['obey-8f-drafter', 88200], ['karin-sultan', 88900],
  ['ubermacht-sentinel-xs', 89300], ['grotti-cheetah-95', 89600], ['vapid-dominator-gtx', 90400], ['karin-futo', 91200],
  ['dinka-blista-compact', 93800],
];
const crewBySlug = (slug: string) => {
  const c = sampleCrews.find((x) => x.slug === slug)!;
  return { tag: c.tag, color: c.color };
};
// name, crew slug (or null), skill offset ms
const SAMPLE_DRIVERS: [string, string | null, number][] = [
  ['Racer_01', 'sample-apex-syndicate', 0], ['SpeedyNomad', 'sample-leonida-lap-club', 350], ['CoastalRun', null, 600],
  ['Nightshift', 'sample-midnight-meet', 800], ['LatteBrake', 'sample-nordring-crew', 950], ['ViceRacer', 'sample-apex-syndicate', 1100],
  ['ApexLimit', 'sample-leonida-lap-club', 1250], ['ShadowLine', null, 1400], ['TurnInEarly', 'sample-gulf-coast-racing', 1550],
  ['Hillclimb', 'sample-nordring-crew', 1700], ['SolarFlare', 'sample-vice-drift-union', 1850], ['MintyTires', null, 2000],
  ['KerbHopper', 'sample-apex-syndicate', 2150], ['LateApex', 'sample-leonida-lap-club', 2300], ['RedlineRosa', 'sample-gulf-coast-racing', 2450],
  ['Slipstream_K', null, 2600], ['GhostPedal', 'sample-midnight-meet', 2750], ['TarmacTom', 'sample-nordring-crew', 2900],
  ['NeonDrift', 'sample-vice-drift-union', 3050], ['PitWallPete', null, 3200], ['OceanDriveOG', 'sample-gulf-coast-racing', 3350],
  ['FlatOutFinn', 'sample-nordring-crew', 3500], ['BrakeLate99', null, 3650], ['VelvetClutch', 'sample-vice-drift-union', 3800],
];

function buildSample(): LbEntry[] {
  const r = rng(1601);
  const out: LbEntry[] = [];
  SAMPLE_DRIVERS.forEach(([name, crewSlug, skill], i) => {
    const count = 1 + Math.floor(r() * 4);
    const picked = new Set<number>();
    while (picked.size < count) {
      // bias towards the faster cars, but every car gets drivers
      const idx = Math.floor(Math.pow(r(), 1.4) * SAMPLE_VEHICLES.length);
      picked.add(idx);
    }
    const entries = count + Math.floor(r() * 30);
    for (const idx of picked) {
      const [id, basePace] = SAMPLE_VEHICLES[idx];
      const v = vehicleOptions.find((x) => x.id === id)!;
      out.push({
        driver: name,
        driver_id: `sample-${i}`,
        crew: crewSlug ? crewBySlug(crewSlug) : null,
        vehicle_id: v.id,
        make: v.make,
        model: v.model,
        logo: v.logoSlug,
        lap_time_ms: basePace + skill + Math.floor(r() * 900),
        entries,
        verified: r() < 0.55,
        video_url: null,
      });
    }
  });
  return out;
}
export const sampleEntries: LbEntry[] = buildSample();

// ---------------------------------------------------------------------------
// Ranking + filtering
// ---------------------------------------------------------------------------
const norm = (t: string) => t.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const vehName = (e: { make: string; model: string }) => `${e.make} ${e.model}`;
const byTime = (a: LbEntry, b: LbEntry) => a.lap_time_ms - b.lap_time_ms || a.driver.localeCompare(b.driver);

function matchDriver(e: LbEntry, q: string) {
  return !q || norm(e.driver).includes(q) || (e.crew ? norm(e.crew.tag).includes(q) : false);
}
function matchVehicle(e: { make: string; model: string }, q: string) {
  return !q || norm(vehName(e)).includes(q);
}

/** Overall: every driver once, with his fastest vehicle. */
export function overallRows(all: LbEntry[], verifiedOnly: boolean) {
  const best = new Map<string, LbEntry>();
  for (const e of all) {
    if (verifiedOnly && !e.verified) continue;
    const cur = best.get(e.driver_id);
    if (!cur || byTime(e, cur) < 0) best.set(e.driver_id, e);
  }
  return [...best.values()].sort(byTime).map((e, i) => ({ e, rank: i + 1 }));
}
/** One vehicle: every driver's best on that vehicle. */
export function vehicleRows(all: LbEntry[], vehicleId: string, verifiedOnly: boolean) {
  return all.filter((e) => e.vehicle_id === vehicleId && (!verifiedOnly || e.verified)).sort(byTime).map((e, i) => ({ e, rank: i + 1 }));
}
/** Vehicle Records: record per vehicle. */
export function vehicleRecords(all: LbEntry[], verifiedOnly: boolean) {
  const map = new Map<string, { record: LbEntry; drivers: LbEntry[] }>();
  for (const e of all) {
    if (verifiedOnly && !e.verified) continue;
    const m = map.get(e.vehicle_id);
    if (!m) map.set(e.vehicle_id, { record: e, drivers: [e] });
    else { m.drivers.push(e); if (byTime(e, m.record) < 0) m.record = e; }
  }
  return [...map.values()].sort((a, b) => byTime(a.record, b.record)).map((v, i) => ({ ...v, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// Markup
// ---------------------------------------------------------------------------
const base = import.meta.env.BASE_URL;
export function lapTime(ms: number) {
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), t = ms % 1000;
  return `${m}:${String(s).padStart(2, '0')}.${String(t).padStart(3, '0')}`;
}
const logoUrl = (slug: string | null) => (slug ? `${base}images/logos/${slug}-gta-6-logo.webp` : null);
const inGarage = (id: string) => vehicleOptions.some((v) => v.id === id);
const garageUrl = (id: string) => `${base}garage/vehicles/${encodeURIComponent(id)}/`;

function logoChip(e: { make: string; logo: string | null }, lg = false) {
  const u = logoUrl(e.logo);
  const px = lg ? 30 : 20;
  return u ? `<span class="logo-chip${lg ? ' logo-chip-lg' : ''}"><img src="${u}" alt="${esc(e.make)} logo" width="${px}" height="${px}" loading="lazy" /></span>` : '';
}
function vehicleCell(e: LbEntry) {
  const inner = `${logoChip(e)}<span class="lb-vehicle-name"><span class="lb-make">${esc(e.make)}</span> ${esc(e.model)}</span>`;
  return inGarage(e.vehicle_id)
    ? `<a class="lb-vehicle lb-vehicle-link" href="${garageUrl(e.vehicle_id)}" title="${esc(vehName(e))} in The Garage">${inner}</a>`
    : `<span class="lb-vehicle">${inner}</span>`;
}
function crewTag(c: LbEntry['crew']) {
  if (!c || !/^#[0-9a-fA-F]{6}$/.test(c.color)) return '';
  return ` <a class="crew-tag crew-tag-sm lb-crew-tag" style="--crew-color:${c.color}" href="${base}hub/crews/?q=${encodeURIComponent(c.tag)}" title="Crew ${esc(c.tag)} in The Hub">${esc(c.tag)}</a>`;
}
const CHECK = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
function statusCell(verified: boolean) {
  return verified
    ? `<span class="status-ok"><span class="check-circle">${CHECK}</span> Video verified</span>`
    : '<span class="status-pending"><span class="status-dot"></span> Not video verified</span>';
}
function videoCell(e: LbEntry, sample: boolean) {
  if (!e.verified) return '—';
  if (e.video_url && /^https:\/\//.test(e.video_url)) return `<a class="watch-btn outline-hover" href="${esc(e.video_url)}" target="_blank" rel="noopener" aria-label="Watch ${esc(e.driver)}'s lap">Watch</a>`;
  return sample ? '<span class="watch-btn is-disabled" title="Sample data — no real video">Watch</span>' : '—';
}
const gap = (ms: number, best: number) => (ms === best ? '' : `<span class="lb-gap">+${((ms - best) / 1000).toFixed(3)}</span>`);
const empty = (cols: number, text: string) => `<tr class="lb-empty-row"><td colspan="${cols}">${text}</td></tr>`;

export interface Rendered { head: string; body: string; context: string; more: string; meta: string }

export function render(all: LbEntry[], s: LbState, sample: boolean): Rendered {
  const qd = norm(s.qDriver), qv = norm(s.qVehicle);
  const filtering = Boolean(qd || qv);
  const cap = <T>(rows: T[]): T[] => (s.showAll || filtering ? rows : rows.slice(0, PAGE));
  const moreBtn = (shown: number, total: number, noun: string) =>
    shown < total ? `<button type="button" class="btn btn-outline lb-more-btn" data-lb-more>Show all ${total} ${noun}</button>` : '';
  const vf = s.verifiedOnly ? ' verified' : '';
  const driverCount = new Set(all.map((e) => e.driver_id)).size;
  const laps = [...new Map(all.map((e) => [e.driver_id, e.entries])).values()].reduce((a, b) => a + b, 0);
  const metaBase = `Gellhorn International Raceway · PS5 · Current Standard · ${driverCount} driver${driverCount === 1 ? '' : 's'} · ${laps} accepted lap${laps === 1 ? '' : 's'}`;

  // --- single vehicle board ---
  if (s.view === 'vehicles' && s.vehicle) {
    const v = all.find((e) => e.vehicle_id === s.vehicle) ?? (() => {
      const g = vehicleOptions.find((x) => x.id === s.vehicle);
      return g ? ({ make: g.make, model: g.model, logo: g.logoSlug, vehicle_id: g.id } as LbEntry) : null;
    })();
    const ranked = vehicleRows(all, s.vehicle, s.verifiedOnly);
    const rows = ranked.filter(({ e }) => matchDriver(e, qd));
    const shown = cap(rows);
    const best = ranked[0]?.e.lap_time_ms ?? 0;
    const head = '<tr><th scope="col">#</th><th scope="col">Driver</th><th scope="col">Track Entries</th><th scope="col">Lap Time</th><th scope="col">Status</th><th scope="col">Video</th></tr>';
    const body = shown.length
      ? shown.map(({ e, rank }) => `<tr class="${rank <= 3 ? 'is-top3' : ''}"><td class="lb-rank">${rank}</td><td class="lb-driver">${esc(e.driver)}${crewTag(e.crew)}</td><td class="lb-num">${e.entries}</td><td class="lb-time">${lapTime(e.lap_time_ms)}${gap(e.lap_time_ms, best)}</td><td>${statusCell(e.verified)}</td><td class="lb-video">${videoCell(e, sample)}</td></tr>`).join('')
      : empty(6, ranked.length ? 'No driver matches your search.' : `No${vf} times on this vehicle yet.`);
    const name = v ? `${esc(v.make)} ${esc(v.model)}` : 'Unknown vehicle';
    const context = `<div class="lb-context">
      <button type="button" class="lb-back" data-lb-back><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>All vehicles</button>
      <div class="lb-context-title">${v ? logoChip(v, true) : ''}<div><p class="lb-context-kicker">Vehicle Leaderboard</p><h3>${name}</h3></div></div>
      ${v && inGarage(v.vehicle_id) ? `<a class="lb-context-link" href="${garageUrl(v.vehicle_id)}">Open in The Garage</a>` : ''}
    </div>`;
    return { head, body, context, more: moreBtn(shown.length, rows.length, `${s.verifiedOnly ? 'verified ' : ''}times`), meta: `${metaBase} · ${ranked.length} driver${ranked.length === 1 ? '' : 's'} on this vehicle` };
  }

  // --- vehicle records list ---
  if (s.view === 'vehicles') {
    const recs = vehicleRecords(all, s.verifiedOnly);
    const rows = recs.filter((r) => matchVehicle(r.record, qv) && (!qd || r.drivers.some((d) => matchDriver(d, qd))));
    const shown = cap(rows);
    const head = '<tr><th scope="col">#</th><th scope="col">Vehicle</th><th scope="col">Record Holder</th><th scope="col">Drivers</th><th scope="col">Record</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Leaderboard</span></th></tr>';
    const body = shown.length
      ? shown.map(({ record: e, drivers, rank }) => `<tr><td class="lb-rank">${rank}</td><td>${vehicleCell(e)}</td><td class="lb-driver">${esc(e.driver)}${crewTag(e.crew)}</td><td class="lb-num">${drivers.length}</td><td class="lb-time">${lapTime(e.lap_time_ms)}</td><td>${statusCell(e.verified)}</td><td class="lb-video"><button type="button" class="watch-btn outline-hover" data-lb-vehicle="${esc(e.vehicle_id)}" aria-label="Open the ${esc(vehName(e))} leaderboard">Leaderboard</button></td></tr>`).join('')
      : empty(7, recs.length ? 'No vehicle matches your search.' : `No${vf} times yet.`);
    const context = `<p class="lb-context-note">Fastest${vf} time for every vehicle on Gellhorn. Open a vehicle to see its full leaderboard.</p>`;
    return { head, body, context, more: moreBtn(shown.length, rows.length, 'vehicles'), meta: `${metaBase} · ${recs.length} vehicle${recs.length === 1 ? '' : 's'} with${vf} times` };
  }

  // --- overall ---
  const ranked = overallRows(all, s.verifiedOnly);
  const rows = ranked.filter(({ e }) => matchDriver(e, qd) && matchVehicle(e, qv));
  const shown = cap(rows);
  const best = ranked[0]?.e.lap_time_ms ?? 0;
  const head = '<tr><th scope="col">#</th><th scope="col">Driver</th><th scope="col">Vehicle</th><th scope="col">Track Entries</th><th scope="col">Lap Time</th><th scope="col">Status</th><th scope="col">Video</th></tr>';
  const body = shown.length
    ? shown.map(({ e, rank }) => `<tr class="${rank <= 3 ? 'is-top3' : ''}"><td class="lb-rank">${rank}</td><td class="lb-driver">${esc(e.driver)}${crewTag(e.crew)}</td><td>${vehicleCell(e)}</td><td class="lb-num">${e.entries}</td><td class="lb-time">${lapTime(e.lap_time_ms)}${gap(e.lap_time_ms, best)}</td><td>${statusCell(e.verified)}</td><td class="lb-video">${videoCell(e, sample)}</td></tr>`).join('')
    : empty(7, ranked.length ? 'No time matches your search.' : `No${vf} times yet.`);
  const context = qv
    ? '<p class="lb-context-note">Overall shows each driver\'s fastest vehicle only. Use Vehicle Records to see every time on one vehicle.</p>'
    : '';
  return { head, body, context, more: moreBtn(shown.length, rows.length, `${s.verifiedOnly ? 'verified ' : ''}drivers`), meta: metaBase };
}

/** Vehicles Needed: vehicles that have times but no verified record first,
 *  then fast garage cars nobody has driven yet. */
export function vehiclesNeededHtml(all: LbEntry[], max = 4): string {
  const withTimes = new Map<string, LbEntry>();
  const verified = new Set<string>();
  for (const e of all) { withTimes.set(e.vehicle_id, e); if (e.verified) verified.add(e.vehicle_id); }
  const list: { id: string; make: string; model: string; logo: string | null; note: string }[] = [];
  for (const [id, e] of withTimes) if (!verified.has(id) && inGarage(id)) list.push({ id, make: e.make, model: e.model, logo: e.logo, note: 'Times, none verified yet' });
  for (const v of vehicleOptions) {
    if (list.length >= max) break;
    if (withTimes.has(v.id) || !v.classes.some((c) => c === 'Super' || c === 'Sports')) continue;
    list.push({ id: v.id, make: v.make, model: v.model, logo: v.logoSlug, note: 'No time yet' });
  }
  return list.slice(0, max).map((v) => `<li>${logoChip(v, true)}<span class="needed-text"><a class="needed-link" href="${garageUrl(v.id)}"><strong>${esc(v.make)} ${esc(v.model)}</strong></a><span>${v.note}</span></span></li>`).join('');
}
