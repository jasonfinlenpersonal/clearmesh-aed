import { normaliseW3w } from "@/lib/geo";
import { searchPlaces, type Place } from "@/lib/geocode";
import { memoryLimit } from "@/lib/ratelimit";
import { clientIp } from "@/lib/request";
import { fromWhat3words } from "@/lib/what3words";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3 || q.length > 200) {
    return Response.json({ places: [], message: "Type at least three characters." }, { status: 400 });
  }
  if (!memoryLimit(`search:${clientIp(req)}`, 20, 60_000)) {
    return Response.json({ places: [], message: "Too many searches. Wait a minute." }, { status: 429 });
  }

  const words = normaliseW3w(q);
  if (words) {
    const r = await fromWhat3words(words);
    if (!r.ok) return Response.json({ places: [], message: r.message });
    const place: Place = { label: `${words}${r.nearestPlace ? ` (near ${r.nearestPlace})` : ""}`, lat: r.lat, lng: r.lng };
    return Response.json({ places: [place] });
  }

  try {
    const places = await searchPlaces(q);
    return Response.json({ places, message: places.length ? undefined : "No places found in Australia." });
  } catch (err) {
    console.warn("[search] failed", err);
    return Response.json({ places: [], message: "Address search is unavailable right now." }, { status: 502 });
  }
}
