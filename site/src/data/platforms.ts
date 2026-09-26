// Platforms (DEC-0073, revised 2026-09-26).
// Launch = PS5 only. Wherever a platform used to be chosen (lap submission,
// crew editor, event editor, crew/event filters, moderator override), Xbox
// Series X|S and PC stay VISIBLE but greyed out with "coming later" -- so
// nobody assumes the site already works for them. Texts speak of PS5 only.
// Enabling a platform later = set active: true here (PC also needs a DB value
// in runs.platform / crews.platforms / hub_events.platforms first).
export interface PlatformDef {
  id: 'ps5' | 'xbox' | 'pc';
  label: string;
  short: string;
  runValue: string; // value in runs.platform
  active: boolean;
}
export const PLATFORMS: PlatformDef[] = [
  { id: 'ps5', label: 'PS5', short: 'PS5', runValue: 'ps5', active: true },
  { id: 'xbox', label: 'Xbox Series X|S', short: 'XBOX', runValue: 'xbox_series', active: false },
  { id: 'pc', label: 'PC', short: 'PC', runValue: 'pc', active: false },
];
export const ACTIVE_PLATFORMS = PLATFORMS.filter((p) => p.active).map((p) => p.id);
export const LEADERBOARD_PLATFORM = 'ps5';
export const comingLater = (p: PlatformDef) => `${p.label} support is coming later — not available yet.`;
