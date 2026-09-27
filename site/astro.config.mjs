// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Eigene Domain leonidaracing.com (DEC-0081, angebunden 2026-09-27): Seite
// liegt auf der Root, daher kein `base` mehr. Vorher: GitHub-Pages-
// Projektseite unter https://fausto511.github.io/gellhorn-racing/ mit
// base '/gellhorn-racing'. robots.txt, llms.txt, canonical und og:url folgen
// `site` automatisch.
const base = '/';

export default defineConfig({
  site: 'https://leonidaracing.com',
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
        !page.endsWith('/time-attack/') && !page.includes('/tracks/') && !page.includes('/report/') && !page.includes('/report-content/') && !page.endsWith('.txt'),
    }),
  ],
  // Forwarding URLs (/time-attack/ and the old /tracks/gellhorn-international-raceway/)
  // are real pages now (src/components/RedirectPage.astro) instead of
  // Astro's `redirects`, whose generated page flashed white (2026-09-26).
});
