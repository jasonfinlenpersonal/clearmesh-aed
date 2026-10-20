// OpenStreetMap Nominatim, within its usage policy: an identifying
// User-Agent, at most one request per second (queued here), results cached,
// and no search-as-you-type (the UI searches on submit only).

const BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "ClearmeshAED/1.0 (+https://aed.clearmesh.app)";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export type Place = { label: string; lat: number; lng: number };

const cache = new Map<string, { at: number; value: unknown }>();
let queue: Promise<unknown> = Promise.resolve();
let lastCall = 0;

function cached<T>(k: string): T | undefined {
  const hit = cache.get(k);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.value as T;
  return undefined;
}

function remember(k: string, value: unknown) {
  if (cache.size >= 1000) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(k, { at: Date.now(), value });
}

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastCall + 1100 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    return fn();
  });
  queue = run.catch(() => undefined);
  return run;
}

async function nominatim(pathAndQuery: string): Promise<unknown> {
  const email = process.env.NOMINATIM_EMAIL;
  const url = `${BASE}${pathAndQuery}${email ? `&email=${encodeURIComponent(email)}` : ""}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en-AU" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return res.json();
}

export async function searchPlaces(q: string): Promise<Place[]> {
  const k = `s:${q.toLowerCase()}`;
  const hit = cached<Place[]>(k);
  if (hit) return hit;
  const data = (await throttled(() =>
    nominatim(`/search?format=jsonv2&countrycodes=au&limit=5&q=${encodeURIComponent(q)}`),
  )) as Array<{ display_name: string; lat: string; lon: string }>;
  const places = data.map((p) => ({ label: p.display_name, lat: Number(p.lat), lng: Number(p.lon) }));
  remember(k, places);
  return places;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const k = `r:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const hit = cached<string | null>(k);
  if (hit !== undefined) return hit;
  try {
    const data = (await throttled(() =>
      nominatim(`/reverse?format=jsonv2&zoom=18&lat=${lat}&lon=${lng}`),
    )) as { display_name?: string };
    const label = data.display_name ?? null;
    remember(k, label);
    return label;
  } catch (err) {
    console.warn("[geocode] reverse failed", err);
    return null;
  }
}
