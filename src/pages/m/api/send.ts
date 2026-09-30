import type { APIRoute } from 'astro';
import { UMAMI_URL } from '../../../lib/umami';

// Relays tracker events to Umami, passing on the visitor's IP and user agent so location and device stats stay right
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': request.headers.get('user-agent') ?? '',
    'X-Forwarded-For': ip,
  };
  const session = request.headers.get('x-umami-cache');
  if (session) headers['x-umami-cache'] = session;

  try {
    const res = await fetch(`${UMAMI_URL}/api/send`, { method: 'POST', headers, body: await request.text() });
    return new Response(await res.text(), { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' } });
  } catch {
    return new Response(null, { status: 204 });
  }
};
