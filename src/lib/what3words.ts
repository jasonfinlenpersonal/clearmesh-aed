// what3words REST API. All optional: without W3W_API_KEY these return
// null / a friendly message and the rest of the app carries on.

const BASE = "https://api.what3words.com/v3";

function apiKey(): string | null {
  return process.env.W3W_API_KEY || null;
}

/** Coordinates to ///word.word.word, or null if unavailable. */
export async function toWhat3words(lat: number, lng: number): Promise<string | null> {
  const k = apiKey();
  if (!k) return null;
  const url = `${BASE}/convert-to-3wa?coordinates=${lat},${lng}&language=en&key=${encodeURIComponent(k)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = (await res.json()) as { words?: string; error?: { message: string } };
    if (!res.ok || !data.words) {
      console.warn("[w3w] convert-to-3wa failed", res.status, data.error?.message);
      return null;
    }
    return `///${data.words}`;
  } catch (err) {
    console.warn("[w3w] convert-to-3wa error", err);
    return null;
  }
}

export type W3wLookup =
  | { ok: true; lat: number; lng: number; nearestPlace: string | null }
  | { ok: false; message: string };

/** ///word.word.word to coordinates. what3words may require a paid plan for this. */
export async function fromWhat3words(words: string): Promise<W3wLookup> {
  const k = apiKey();
  if (!k) return { ok: false, message: "what3words search isn't set up on this site yet." };
  const bare = words.replace(/^\/+/, "");
  const url = `${BASE}/convert-to-coordinates?words=${encodeURIComponent(bare)}&key=${encodeURIComponent(k)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = (await res.json()) as {
      coordinates?: { lat: number; lng: number };
      nearestPlace?: string;
      error?: { code: string; message: string };
    };
    if (!res.ok || !data.coordinates) {
      return { ok: false, message: data.error?.message ?? "what3words couldn't find that address." };
    }
    return {
      ok: true,
      lat: data.coordinates.lat,
      lng: data.coordinates.lng,
      nearestPlace: data.nearestPlace ?? null,
    };
  } catch {
    return { ok: false, message: "what3words didn't respond. Try again shortly." };
  }
}
