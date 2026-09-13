// @ts-check
import { defineConfig } from 'astro/config';

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
  redirects: {
    // DEC-0047: /time-attack/ is reserved for a future multi-track hub.
    // Until a second track exists, it forwards to the only active track.
    // NB: astro's `redirects` does NOT auto-prefix the target with `base` —
    // muss hier explizit passieren, sonst 404 die Weiterleitung sobald unter
    // einem Unterpfad deployed.
    '/time-attack/': `${base}/tracks/gellhorn-international-raceway/`,
  },
});
