// Sample data for visual/layout testing only. No real community records exist
// yet — GTA VI has not launched. Replace with the live Supabase feed once
// submissions open.
export interface LapRow {
  rank: number;
  driver: string;
  make: string;
  model: string;
  entries: number;
  time: string;
  gapMs: number | null;
  videoVerified: boolean;
}

export const sampleLaps: LapRow[] = [
  { rank: 1, driver: 'Racer_01', make: 'Bravado', model: 'Banshee', entries: 48, time: '1:24.683', gapMs: null, videoVerified: true },
  { rank: 2, driver: 'SpeedyNomad', make: 'Grotti', model: 'Itali GTO', entries: 36, time: '1:25.317', gapMs: 634, videoVerified: true },
  { rank: 3, driver: 'CoastalRun', make: 'Pfister', model: '811', entries: 52, time: '1:25.908', gapMs: 1225, videoVerified: true },
  { rank: 4, driver: 'Nightshift', make: 'Declasse', model: 'Vigero ZX', entries: 28, time: '1:26.441', gapMs: 1758, videoVerified: false },
  { rank: 5, driver: 'LatteBrake', make: 'Karin', model: 'Sultan RS', entries: 31, time: '1:26.973', gapMs: 2290, videoVerified: true },
  { rank: 6, driver: 'ViceRacer', make: 'Pegassi', model: 'Zentorno', entries: 19, time: '1:27.516', gapMs: 2833, videoVerified: false },
  { rank: 7, driver: 'ApexLimit', make: 'Lampadati', model: 'Corsita', entries: 44, time: '1:27.864', gapMs: 3181, videoVerified: true },
  { rank: 8, driver: 'ShadowLine', make: 'Übermacht', model: 'Sentinel XS', entries: 26, time: '1:28.197', gapMs: 3514, videoVerified: true },
  { rank: 9, driver: 'TurnInEarly', make: 'Bravado', model: 'Gauntlet Hellfire', entries: 33, time: '1:28.603', gapMs: 3920, videoVerified: false },
  { rank: 10, driver: 'Hillclimb', make: 'Grotti', model: 'Stinger TT', entries: 21, time: '1:29.118', gapMs: 4435, videoVerified: true },
  { rank: 11, driver: 'SolarFlare', make: 'Karin', model: 'Calico GTF', entries: 27, time: '1:29.642', gapMs: 4959, videoVerified: true },
  { rank: 12, driver: 'MintyTires', make: 'Pegassi', model: 'Tempesta', entries: 18, time: '1:30.021', gapMs: 5338, videoVerified: false },
];

export interface NeededVehicle {
  make: string;
  model: string;
}

export const vehiclesNeeded: NeededVehicle[] = [
  { make: 'Bravado', model: 'Banshee GTS' },
  { make: 'Übermacht', model: 'Sentinel XS' },
  { make: 'Albany', model: 'Manana' },
];

export const leaderboardStats = {
  drivers: 12,
  acceptedLaps: sampleLaps.reduce((sum, l) => sum + l.entries, 0),
};

// Manufacturer logos: sourced from the confirmed GTA VI vehicle-manufacturer
// logo set (Visual/Logos/Car Manufacturers/web/*.webp), 256x256 transparent
// WebP. Several source logos are black/dark and not yet produced in a light
// variant (per that folder's README) — they're shown in a light chip below
// so they stay visible on the dark background.
const makeSlug: Record<string, string> = {
  Bravado: 'bravado',
  Grotti: 'grotti',
  Pfister: 'pfister',
  Declasse: 'declasse',
  Karin: 'karin',
  Pegassi: 'pegassi',
  Lampadati: 'lampadati',
  'Übermacht': 'ubermacht',
  Albany: 'albany',
};

export function makeLogo(make: string): string | null {
  const slug = makeSlug[make];
  const base = import.meta.env.BASE_URL;
  return slug ? `${base}images/logos/${slug}-gta-6-logo.webp` : null;
}
