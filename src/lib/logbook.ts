// Logbooks of projects in progress: a LOG.md in the project's repo with entries like
//
//   ## 2026-10-19 · Peak shapes and exposure time
//   What I did and learned, in Markdown, with $inline$ and $$display$$ math.
//
// read from GitHub (cached like the site data) and rendered to HTML with KaTeX for the formulas.
import { Marked } from 'marked';
import katex from 'katex';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface LogEntry { date: string; title: string; html: string }

const TTL = 5 * 60 * 1000;
const cache = new Map<string, { entries: LogEntry[]; expires: number }>();

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Raw HTML in a log is shown as text, never run
const markdown = new Marked({ gfm: true, renderer: { html: ({ text }) => escapeHtml(text) } });

/** Formulas become KaTeX HTML before Markdown sees them, so underscores and asterisks in them stay intact */
function render(md: string) {
  const math: string[] = [];
  const keep = (html: string) => `MATHPLACEHOLDER${math.push(html) - 1}X`;
  const tex = (src: string, displayMode: boolean) => katex.renderToString(src.trim(), { displayMode, throwOnError: false });
  const prepared = md
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, src) => keep(tex(src, true)))
    .replace(/(?<![\\$\w])\$([^$\n]+?)\$(?!\w)/g, (_, src) => keep(tex(src, false)));
  const html = markdown.parse(prepared) as string;
  return html.replace(/MATHPLACEHOLDER(\d+)X/g, (_, i) => math[+i]);
}

/** `## YYYY-MM-DD · Title` starts an entry; newest first */
export function parseLog(md: string): LogEntry[] {
  return md
    .split(/^##\s+/m)
    .slice(1)
    .map(part => {
      const [head, ...body] = part.split('\n');
      const m = head.match(/^(\d{4}-\d{2}-\d{2})\s*[·—–:-]?\s*(.*)$/);
      return m ? { date: m[1], title: m[2].trim(), html: render(body.join('\n').trim()) } : null;
    })
    .filter((e): e is LogEntry => e !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// `npm run dev` reads the project's local checkout next to this repo, so entries can be previewed before pushing
async function readLocal(url: string) {
  const m = url.match(/raw\.githubusercontent\.com\/[^/]+\/([^/]+)\/[^/]+\/(.+)$/);
  return m ? readFile(resolve(process.cwd(), '..', m[1], m[2]), 'utf8') : null;
}

export async function fetchLog(url: string): Promise<LogEntry[]> {
  if (import.meta.env.DEV) {
    const local = await readLocal(url).catch(() => null);
    if (local !== null) return parseLog(local);
  }
  const cached = cache.get(url);
  if (cached && Date.now() < cached.expires) return cached.entries;
  try {
    const res = await fetch(url);
    if (res.status === 404) {
      cache.set(url, { entries: [], expires: Date.now() + TTL });   // no log yet
      return [];
    }
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const entries = parseLog(await res.text());
    cache.set(url, { entries, expires: Date.now() + TTL });
    return entries;
  } catch (err) {
    console.warn(`Logbook ${url} unavailable:`, err);
    return cached?.entries ?? [];
  }
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const formatDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00Z`));
