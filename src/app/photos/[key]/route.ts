import { eq } from "drizzle-orm";
import { currentAdminEmail } from "@/lib/admin";
import { db } from "@/lib/db";
import { defibrillators } from "@/lib/schema";
import { PHOTO_KEY_PATTERN, photoStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

// Photos of approved AEDs are public. Photos still in review (or rejected)
// are only shown to admins.
export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  if (!PHOTO_KEY_PATTERN.test(key)) return new Response("Not found", { status: 404 });

  const [owner] = await db()
    .select({ status: defibrillators.status })
    .from(defibrillators)
    .where(eq(defibrillators.photoUrl, key))
    .limit(1);
  if (!owner) return new Response("Not found", { status: 404 });

  const isPublic = owner.status === "approved";
  if (!isPublic && !(await currentAdminEmail())) return new Response("Not found", { status: 404 });

  const data = await photoStorage().get(key);
  if (!data) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": isPublic ? "public, max-age=86400" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
