// robots.txt generated from `site` + `base` so it follows the domain switch
// (DEC-0081) without a manual edit. No Disallow lines on purpose (RS-0050):
// /account/ and /moderator/ carry `noindex` themselves, and Google only sees
// that tag if it may crawl the page. Access control is Supabase auth/RLS.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const sitemap = new URL(`${base}sitemap-index.xml`, site).href;
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
