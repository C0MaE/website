import type { APIRoute } from 'astro';
import { loadSite, llmsTxt } from '../lib/site';

// Summary of the site for AI assistants and crawlers (https://llmstxt.org), built from the same data as the page
export const GET: APIRoute = async () =>
  new Response(llmsTxt(await loadSite()), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
