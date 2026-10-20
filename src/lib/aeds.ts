import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { toPublicAed, type PublicAed } from "./public-aed";
import { aedReports, defibrillators, type AedStatus } from "./schema";

export async function listApproved(): Promise<PublicAed[]> {
  const rows = await db()
    .select()
    .from(defibrillators)
    .where(eq(defibrillators.status, "approved"))
    .orderBy(asc(defibrillators.title))
    .limit(50_000);
  return rows.map(toPublicAed);
}

export async function getAed(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db().select().from(defibrillators).where(eq(defibrillators.id, id));
  return row ?? null;
}

export async function getApprovedAed(id: string) {
  const row = await getAed(id);
  return row?.status === "approved" ? row : null;
}

export async function listByStatus(status: AedStatus) {
  return db()
    .select()
    .from(defibrillators)
    .where(eq(defibrillators.status, status))
    .orderBy(status === "pending" ? asc(defibrillators.submittedAt) : desc(defibrillators.updatedAt))
    .limit(500);
}

export async function statusCounts(): Promise<Record<AedStatus | "openReports", number>> {
  const rows = await db()
    .select({ status: defibrillators.status, n: count() })
    .from(defibrillators)
    .groupBy(defibrillators.status);
  const [reports] = await db()
    .select({ n: count() })
    .from(aedReports)
    .where(eq(aedReports.status, "open"));
  const out = { pending: 0, approved: 0, rejected: 0, openReports: reports?.n ?? 0 };
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export type NearbyAed = { id: string; title: string; status: AedStatus; distanceM: number };

/** Other AEDs within `metres` of a point: flags likely duplicates during review. */
export async function nearbyAeds(lat: number, lng: number, excludeId: string, metres = 50): Promise<NearbyAed[]> {
  const point = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
  const rows = await db()
    .select({
      id: defibrillators.id,
      title: defibrillators.title,
      status: defibrillators.status,
      distanceM: sql<number>`ST_Distance(${sql.raw("location")}, ${point})`.mapWith(Number),
    })
    .from(defibrillators)
    .where(
      and(
        sql`ST_DWithin(${sql.raw("location")}, ${point}, ${metres})`,
        sql`${defibrillators.id} <> ${excludeId}`,
        sql`${defibrillators.status} <> 'rejected'`,
      ),
    )
    .orderBy(sql`ST_Distance(${sql.raw("location")}, ${point})`)
    .limit(10);
  return rows;
}

export async function reportsForAed(id: string) {
  return db()
    .select()
    .from(aedReports)
    .where(eq(aedReports.defibrillatorId, id))
    .orderBy(desc(aedReports.createdAt))
    .limit(50);
}

export async function openReports() {
  return db()
    .select({
      report: aedReports,
      aedTitle: defibrillators.title,
      aedId: defibrillators.id,
    })
    .from(aedReports)
    .innerJoin(defibrillators, eq(aedReports.defibrillatorId, defibrillators.id))
    .where(eq(aedReports.status, "open"))
    .orderBy(asc(aedReports.createdAt))
    .limit(500);
}

export function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
