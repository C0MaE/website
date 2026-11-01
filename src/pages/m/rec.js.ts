import type { APIRoute } from 'astro';
import { UMAMI_URL } from '../../lib/umami';

// Umami's session recorder (rrweb, for replays and heatmaps), served first-party and cached for an hour.
// The page only loads it for visitors who agreed to be recorded (lib/replay.ts).
let cached: { body: string; expires: number } | null = null;

export const GET: APIRoute = async () => {
  if (!cached || Date.now() > cached.expires) {
    try {
      const res = await fetch(`${UMAMI_URL}/recorder.js`);
      if (!res.ok) throw new Error(`${res.status}`);
      cached = { body: await res.text(), expires: Date.now() + 60 * 60 * 1000 };
    } catch (err) {
      if (!cached) return new Response('', { status: 204 });   // analytics down: no recording, nothing breaks
      console.warn('Umami recorder fetch failed, serving cached copy:', err);
    }
  }
  return new Response(cached.body, {
    headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};

export const HEAD = GET;
