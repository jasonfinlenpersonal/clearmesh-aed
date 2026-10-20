import { getApprovedAed } from "@/lib/aeds";
import { db } from "@/lib/db";
import { reportAllowed } from "@/lib/ratelimit";
import { clientIp, hashIp, sameOrigin } from "@/lib/request";
import { aedReports } from "@/lib/schema";
import { verifyTurnstile } from "@/lib/turnstile";
import { firstErrors, reportSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function fail(status: number, errors: Record<string, string>) {
  return Response.json({ ok: false, errors }, { status });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return fail(403, { form: "Please report from the website." });
  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, { form: "The report couldn't be read." });
  }
  if (body.website) return Response.json({ ok: true }); // honeypot

  const ip = clientIp(req);
  const token = typeof body.turnstileToken === "string" ? body.turnstileToken : null;
  if (!(await verifyTurnstile(token, ip))) {
    return fail(400, { form: "The anti-spam check failed. Please try again." });
  }

  const ipHash = hashIp(ip);
  if (!(await reportAllowed(ipHash))) return fail(429, { form: "Please wait a while before sending more reports." });

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return fail(400, firstErrors(parsed.error));

  const aed = await getApprovedAed(id);
  if (!aed) return fail(404, { form: "That AED isn't listed any more." });

  await db().insert(aedReports).values({
    defibrillatorId: aed.id,
    reportType: parsed.data.reportType,
    details: parsed.data.details,
    reporterIpHash: ipHash,
  });
  return Response.json({ ok: true });
}
