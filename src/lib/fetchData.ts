const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/C0MaE/website/main/data';

const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Bundled at build time — used when GitHub is unreachable so the page still renders
const localData = import.meta.glob('../../data/*.json', { eager: true, import: 'default' });

export async function fetchData<T>(file: string): Promise<T> {
  // `npm run dev` shows the local data/ files so edits can be previewed before pushing
  if (import.meta.env.DEV && localData[`../../data/${file}`] !== undefined) {
    return localData[`../../data/${file}`] as T;
  }

  const url = `${GITHUB_RAW_BASE}/${file}`;
  const cached = cache.get(url);

  if (cached && Date.now() < cached.expires) {
    return cached.data as T;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    }

    const data = (await res.json()) as T;
    cache.set(url, { data, expires: Date.now() + CACHE_TTL });
    return data;
  } catch (err) {
    const fallback = cached?.data ?? localData[`../../data/${file}`];
    if (fallback === undefined) throw err;
    console.warn(`Using fallback data for ${file}:`, err);
    return fallback as T;
  }
}
