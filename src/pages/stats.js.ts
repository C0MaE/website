import type { APIRoute } from 'astro';
import { UMAMI_URL } from '../lib/umami';

// The Umami tracker, served first-party and cached for an hour
let cached: { body: string; expires: number } | null = null;

export const GET: APIRoute = async () => {
  if (!cached || Date.now() > cached.expires) {
    try {
      const res = await fetch(`${UMAMI_URL}/script.js`);
      if (!res.ok) throw new Error(`${res.status}`);
      cached = { body: await res.text(), expires: Date.now() + 60 * 60 * 1000 };
    } catch (err) {
      if (!cached) return new Response('', { status: 204 });   // analytics down: the page just runs without it
      console.warn('Umami script fetch failed, serving cached copy:', err);
    }
  }
  return new Response(cached.body, {
    headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
