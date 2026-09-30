// Content releases that add vehicles (RS-0047, DEC-0084), read from
// public.game_releases (RS-0052). Later updates/DLCs get their own row;
// vehicles point at it via VehicleOption.releaseId.
export interface GameRelease {
  id: string;
  name: string;
  kind: 'base-game' | 'update' | 'dlc';
  date: string | null; // ISO date; null = not announced
}

import generated from './vehicles.generated.json';

// From the database (RS-0052): game_releases, pulled by site/scripts/fetch-vehicles.mjs.
export const gameReleases: GameRelease[] = generated.releases.map((r) => ({
  id: r.release_id, name: r.name, kind: r.kind as GameRelease['kind'], date: r.release_date ?? null,
}));

export const releaseById = Object.fromEntries(gameReleases.map((r) => [r.id, r])) as Record<string, GameRelease>;

// "2026-11-19" -> "Nov 19, 2026" (fixed en-US, UTC so the day never shifts).
export function formatReleaseDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
