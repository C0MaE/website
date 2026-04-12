const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/C0MaE/website/main/data';

const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchData<T>(file: string): Promise<T> {
  const url = `${GITHUB_RAW_BASE}/${file}`;
  const cached = cache.get(url);

  if (cached && Date.now() < cached.expires) {
    return cached.data as T;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  }

  const data = (await res.json()) as T;
  cache.set(url, { data, expires: Date.now() + CACHE_TTL });
  return data;
}
