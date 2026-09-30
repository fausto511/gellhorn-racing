// Content releases that add vehicles (RS-0047, DEC-0084). Mirrors
// public.game_releases in Supabase -- keep both in sync. Later updates/DLCs get
// their own entry; vehicles point at it via VehicleOption.releaseId.
export interface GameRelease {
  id: string;
  name: string;
  kind: 'base-game' | 'update' | 'dlc';
  date: string | null; // ISO date; null = not announced
}

export const gameReleases: GameRelease[] = [
  { id: 'base-game', name: 'Base Game', kind: 'base-game', date: '2026-11-19' },
];

export const releaseById = Object.fromEntries(gameReleases.map((r) => [r.id, r])) as Record<string, GameRelease>;

// "2026-11-19" -> "Nov 19, 2026" (fixed en-US, UTC so the day never shifts).
export function formatReleaseDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
