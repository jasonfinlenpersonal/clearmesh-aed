import { listApproved } from "@/lib/aeds";

export const dynamic = "force-dynamic";

// Every approved AED in one response. Small enough for a whole state for a
// long while, and lets the service worker keep a full offline copy.
export async function GET() {
  const aeds = await listApproved();
  return Response.json(
    { aeds, generatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=600" } },
  );
}
