// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub-Pages-Projektseite: braucht `site` + `base`, weil die Seite unter
// https://fausto511.github.io/gellhorn-racing/ läuft, nicht auf der Root.
// Sobald die eigene Domain (gellhornracing.com) angeschlossen wird: `base`
// auf '' setzen, `site` auf 'https://gellhornracing.com' ändern.
const base = '/gellhorn-racing';

export default defineConfig({
  site: 'https://fausto511.github.io',
  base,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      // /account/ and /moderator/ are private/internal, not content for
      // search -- excluded from the sitemap and separately set to
      // noindex on the page itself (see Base.astro).
      // /hub/ stays out while it only shows sample data (noindex, RS-0022).
      // Forwarding pages (/time-attack/, /tracks/…) are not content either.
      filter: (page) =>
        !page.includes('/account/') && !page.includes('/moderator/') && !page.includes('/hub/') &&
        !page.endsWith('/time-attack/') && !page.includes('/tracks/'),
    }),
  ],
  // Forwarding URLs (/time-attack/ and the old /tracks/gellhorn-international-raceway/)
  // are real pages now (src/components/RedirectPage.astro) instead of
  // Astro's `redirects`, whose generated page flashed white (2026-09-26).
});
