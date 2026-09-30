// llms.txt (llmstxt.org): a plain-text summary for AI assistants and
// answer engines (DEC-0082). Only facts that are true on the site today --
// update it when sections change. URLs follow `site` + `base`.
import type { APIRoute } from 'astro';
import { SITE_NAME, SITE_DISCLAIMER } from '../data/site';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const u = (p: string) => new URL(`${base}${p}`, site).href;
  const body = `# ${SITE_NAME}

> ${SITE_NAME} is an independent racing database and community for Grand Theft Auto VI (GTA 6): a GTA VI vehicle database built from Rockstar's official material, with in-game classes, release info and real-world inspirations ("The Garage"), proof-based Time Attack lap-time leaderboards starting at Gellhorn International Raceway, and an event calendar and crew directory for the racing scene ("The Hub"). ${SITE_DISCLAIMER}

Status: GTA VI releases on November 19, 2026 (PS5, Xbox Series X|S). The site is built ahead of launch: leaderboards and lap data are sample data until real laps can be submitted from launch day, and the rule set ("Gellhorn Standard") is a draft until it has been tested in the game. Time Attack is planned to open on PS5 first. A few vehicles in The Garage are known only from pre-release footage and are marked "Not officially revealed". Crews and events in The Hub can already be created; sample entries are labeled as such.

## The Garage

- [The Garage](${u('garage/')}): GTA VI vehicles with class, seats, drivetrain, release info, first appearance and real-world inspiration; prices, top speeds and lap data are added after launch once they can be checked

## Time Attack

- [Gellhorn International Raceway](${u('time-attack/gellhorn-international-raceway/')}): track page with the leaderboard, filterable by vehicle, driver or crew, and by verification level
- [How It Works](${u('time-attack/how-it-works/')}): how to submit a lap in four steps
- [Rules & Verification](${u('time-attack/rules/')}): what counts as a valid lap; screenshot entry vs. video-verified times

## The Hub

- [The Hub](${u('hub/')}): GTA VI racing community overview
- [Event Calendar](${u('hub/events/')}): race nights, league rounds, time attack sessions and car meets
- [Crews](${u('hub/crews/')}): racing crews and car meet communities
- [Tracks](${u('hub/tracks/')}): community race jobs (GTA 6 / GTA VI) with Social Club links, filterable by race type, layout, vehicle class and lobby size; creators submit, moderators check and publish

## About

- [About](${u('about/')}): what the site is and what it isn't
- [Terms of Use](${u('terms/')})
- [Privacy Policy](${u('privacy/')})
- [Legal notice (Impressum)](${u('legal/')})
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
