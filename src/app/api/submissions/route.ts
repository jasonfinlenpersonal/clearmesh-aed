import { db } from "@/lib/db";
import { reverseGeocode } from "@/lib/geocode";
import { PhotoError, savePhoto } from "@/lib/photos";
import { submissionAllowed } from "@/lib/ratelimit";
import { clientIp, hashIp, sameOrigin } from "@/lib/request";
import { defibrillators } from "@/lib/schema";
import { verifyTurnstile } from "@/lib/turnstile";
import { firstErrors, submissionSchema } from "@/lib/validation";
import { toWhat3words } from "@/lib/what3words";

export const dynamic = "force-dynamic";

function fail(status: number, errors: Record<string, string>) {
  return Response.json({ ok: false, errors }, { status });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, { form: "Please submit from the website." });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, { form: "The form couldn't be read. Is the photo under 10 MB?" });
  }

  // Honeypot: a field people can't see. Bots that fill it get a fake success.
  if (String(form.get("website") ?? "") !== "") return Response.json({ ok: true });

  const ip = clientIp(req);
  if (!(await verifyTurnstile(form.get("cf-turnstile-response")?.toString() ?? null, ip))) {
    return fail(400, { form: "The anti-spam check failed. Please try again." });
  }

  const ipHash = hashIp(ip);
  if (!(await submissionAllowed(ipHash))) {
    return fail(429, { form: "Thanks for all the submissions! Please wait a while before adding more." });
  }

  const fields = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
  const parsed = submissionSchema.safeParse(fields);
  if (!parsed.success) return fail(400, firstErrors(parsed.error));
  const v = parsed.data;

  let photoKey: string | null = null;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      photoKey = await savePhoto(photo);
    } catch (err) {
      if (err instanceof PhotoError) return fail(400, { photo: err.message });
      throw err;
    }
  }

  // Fill gaps from the pin. Both lookups are best-effort and run once here,
  // so map views never call the external APIs.
  const [what3words, address] = await Promise.all([
    v.what3words ?? toWhat3words(v.latitude, v.longitude),
    v.address ?? reverseGeocode(v.latitude, v.longitude),
  ]);

  const [row] = await db()
    .insert(defibrillators)
    .values({
      title: v.title,
      description: v.description,
      accessNotes: v.accessNotes,
      accessType: v.accessType,
      latitude: v.latitude,
      longitude: v.longitude,
      address,
      what3words,
      photoUrl: photoKey,
      openingHours: v.openingHours,
      cabinetLocked: v.cabinetLocked,
      guardianName: v.guardianName,
      submittedByName: v.submittedByName,
      submitterIpHash: ipHash,
      status: "pending",
    })
    .returning({ id: defibrillators.id });

  console.log(`[submit] new pending AED ${row?.id}`);
  return Response.json({ ok: true });
}
