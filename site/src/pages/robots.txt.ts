// robots.txt generated from `site` + `base` so it follows the domain switch
// (DEC-0081) without a manual edit. Private areas stay out of search.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const sitemap = new URL(`${base}sitemap-index.xml`, site).href;
  const body = [
    'User-agent: *',
    'Allow: /',
    `Disallow: ${base}account/`,
    `Disallow: ${base}moderator/`,
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
