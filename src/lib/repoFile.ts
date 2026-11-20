// Files read live from a project's own repo on GitHub (its LOG.md and MILESTONES.md), cached for
// five minutes like the site data: pushing to the project is enough to update the page.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const TTL = 5 * 60 * 1000;
const cache = new Map<string, { value: unknown; expires: number }>();

// `npm run dev` reads the project's local checkout instead, so changes can be previewed before pushing.
// Checkouts are looked for next to this repo, or in the folder LOCAL_REPOS names (see .env.example).
async function readLocal(url: string) {
  const m = url.match(/raw\.githubusercontent\.com\/[^/]+\/([^/]+)\/[^/]+\/(.+)$/);
  if (!m) return null;
  const root = import.meta.env.LOCAL_REPOS || resolve(process.cwd(), '..');
  return readFile(resolve(root, m[1], m[2]), 'utf8').catch(() => null);
}

/** A raw GitHub file, parsed; null while it does not exist or cannot be loaded and nothing is cached */
export async function fetchRepoFile<T>(url: string, parse: (text: string) => T): Promise<T | null> {
  if (import.meta.env.DEV) {
    const local = await readLocal(url);
    if (local !== null) return parse(local);
  }
  const cached = cache.get(url) as { value: T | null; expires: number } | undefined;
  if (cached && Date.now() < cached.expires) return cached.value;
  try {
    const res = await fetch(url);
    if (res.status === 404) {
      cache.set(url, { value: null, expires: Date.now() + TTL });   // not pushed yet
      return null;
    }
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const value = parse(await res.text());
    cache.set(url, { value, expires: Date.now() + TTL });
    return value;
  } catch (err) {
    console.warn(`${url} unavailable:`, err);
    return cached?.value ?? null;
  }
}
