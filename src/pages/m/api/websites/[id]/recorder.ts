import type { APIRoute } from 'astro';
import { UMAMI_URL, UMAMI_WEBSITE_ID } from '../../../../../lib/umami';

// The recorder asks Umami whether replays and heatmaps are on, and at which sample rate and masking level.
// Relayed for this site only, and cached for a minute so changes in the Umami settings show up quickly.
let cached: { body: string; expires: number } | null = null;

export const GET: APIRoute = async ({ params }) => {
  if (params.id !== UMAMI_WEBSITE_ID) return new Response(null, { status: 404 });
  if (!cached || Date.now() > cached.expires) {
    try {
      const res = await fetch(`${UMAMI_URL}/api/websites/${UMAMI_WEBSITE_ID}/recorder`);
      if (!res.ok) throw new Error(`${res.status}`);
      cached = { body: await res.text(), expires: Date.now() + 60 * 1000 };
    } catch {
      cached = { body: '{"enabled":false}', expires: Date.now() + 60 * 1000 };   // unreachable: record nothing
    }
  }
  return new Response(cached.body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
