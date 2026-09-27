// llms.txt (llmstxt.org): a plain-text summary for AI assistants and
// answer engines (DEC-0082). Only facts that are true on the site today --
// update it when sections change. URLs follow `site` + `base`.
import type { APIRoute } from 'astro';
import { SITE_NAME, SITE_DISCLAIMER } from '../data/site';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const u = (p: string) => new URL(`${base}${p}`, site).href;
  const body = `# ${SITE_NAME}

> ${SITE_NAME} is an independent racing database and community for Grand Theft Auto VI (GTA 6): a database of confirmed GTA VI vehicles with verified classes ("The Garage"), proof-based Time Attack lap-time leaderboards starting at Gellhorn International Raceway, and an event calendar and crew directory for the racing scene ("The Hub"). ${SITE_DISCLAIMER}

Status: GTA VI has not been released yet. The site is built ahead of launch; leaderboards, lap data and most Hub content are sample data until real gameplay can be tested. The rule set ("Gellhorn Standard") is a draft. Time Attack currently runs on PS5 only; Xbox Series X|S and PC are planned for later.

## The Garage

- [The Garage](${u('garage/')}): GTA VI vehicles confirmed so far, with verified in-game classes; prices, top speeds and lap data are added once they can be checked

## Time Attack

- [Gellhorn International Raceway](${u('time-attack/gellhorn-international-raceway/')}): track page with the leaderboard, filterable by vehicle, driver or crew, and by verification level
- [How It Works](${u('time-attack/how-it-works/')}): how to submit a lap in four steps
- [Rules & Verification](${u('time-attack/rules/')}): what counts as a valid lap; screenshot entry vs. video-verified times

## The Hub

- [The Hub](${u('hub/')}): GTA VI racing community overview
- [Event Calendar](${u('hub/events/')}): race nights, league rounds, time attack sessions and car meets
- [Crews](${u('hub/crews/')}): racing crews and car meet communities

## About

- [About](${u('about/')}): what the site is and what it isn't
- [Terms of Use](${u('terms/')})
- [Privacy Policy](${u('privacy/')})
- [Legal notice (Impressum)](${u('legal/')})
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
