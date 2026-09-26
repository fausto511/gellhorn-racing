// Platforms shown on the site (DEC-0073, 2026-09-26).
// Launch focuses on PS5 only -- for comparability and so nobody has to wonder
// which board is which. Xbox Series X|S (and later PC) stay in the data model
// (DB check constraints, types, labels); they come back by adding them here.
// With a single active platform every platform picker, filter and chip is
// hidden and PS5 is set automatically.
export const ACTIVE_PLATFORMS = ['ps5'] as const;
export const SINGLE_PLATFORM = ACTIVE_PLATFORMS.length === 1;
/** runs.platform value used for the leaderboard */
export const LEADERBOARD_PLATFORM = 'ps5';
