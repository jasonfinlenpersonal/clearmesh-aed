import { and, count, eq, gt } from "drizzle-orm";
import { db } from "./db";
import { aedReports, defibrillators } from "./schema";

function intEnv(name: string, fallback: number): number {
  const v = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

const HOUR = 60 * 60 * 1000;

// Counted from the database, so limits survive restarts and need no extra service.
export async function submissionAllowed(ipHash: string): Promise<boolean> {
  const perHour = intEnv("SUBMISSIONS_PER_HOUR", 5);
  const perDay = intEnv("SUBMISSIONS_PER_DAY", 20);
  const count24h = (since: Date) =>
    db()
      .select({ n: count() })
      .from(defibrillators)
      .where(and(eq(defibrillators.submitterIpHash, ipHash), gt(defibrillators.submittedAt, since)));
  const [[hour], [day]] = await Promise.all([
    count24h(new Date(Date.now() - HOUR)),
    count24h(new Date(Date.now() - 24 * HOUR)),
  ]);
  return (hour?.n ?? 0) < perHour && (day?.n ?? 0) < perDay;
}

export async function reportAllowed(ipHash: string): Promise<boolean> {
  const perHour = intEnv("REPORTS_PER_HOUR", 10);
  const [row] = await db()
    .select({ n: count() })
    .from(aedReports)
    .where(and(eq(aedReports.reporterIpHash, ipHash), gt(aedReports.createdAt, new Date(Date.now() - HOUR))));
  return (row?.n ?? 0) < perHour;
}

// In-memory limiter for cheap endpoints (search). There's one app container,
// so per-process state is enough.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function memoryLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= max;
}
