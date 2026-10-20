"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { requireAdmin } from "@/lib/admin";
import { getAed, isUuid } from "@/lib/aeds";
import { db } from "@/lib/db";
import { PhotoError, savePhoto } from "@/lib/photos";
import { aedReports, defibrillators, type AedStatus } from "@/lib/schema";
import { photoStorage } from "@/lib/storage";
import { adminEditSchema, firstErrors } from "@/lib/validation";
import { toWhat3words } from "@/lib/what3words";

export type SaveState = { ok: boolean; message?: string; errors?: Record<string, string> };

function refresh(id?: string) {
  revalidatePath("/admin", "layout");
  if (id) revalidatePath(`/aed/${id}`);
}

export async function saveAed(id: string, _prev: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin();
  const existing = await getAed(id);
  if (!existing) return { ok: false, message: "This AED no longer exists." };

  const fields = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
  const parsed = adminEditSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, errors: firstErrors(parsed.error), message: "Check the highlighted fields." };
  const v = parsed.data;

  let photoUrl = existing.photoUrl;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await savePhoto(photo);
    } catch (err) {
      if (err instanceof PhotoError) return { ok: false, errors: { photo: err.message } };
      throw err;
    }
  }

  const moved = v.latitude !== existing.latitude || v.longitude !== existing.longitude;
  const what3words = v.what3words ?? (moved || !existing.what3words ? await toWhat3words(v.latitude, v.longitude) : null);

  await db()
    .update(defibrillators)
    .set({
      title: v.title,
      description: v.description,
      accessNotes: v.accessNotes,
      accessType: v.accessType,
      latitude: v.latitude,
      longitude: v.longitude,
      address: v.address,
      what3words,
      openingHours: v.openingHours,
      cabinetLocked: v.cabinetLocked,
      guardianName: v.guardianName,
      guardianContact: v.guardianContact,
      lastCheckedAt: v.lastCheckedAt,
      adminNotes: v.adminNotes,
      photoUrl,
    })
    .where(eq(defibrillators.id, id));

  if (photoUrl !== existing.photoUrl && existing.photoUrl) await photoStorage().delete(existing.photoUrl);
  refresh(id);
  return { ok: true, message: "Saved." };
}

export async function setStatus(id: string, status: AedStatus, form: FormData): Promise<void> {
  const email = await requireAdmin();
  if (!isUuid(id)) return;
  const reason = String(form.get("rejectionReason") ?? "").trim().slice(0, 1000) || null;
  await db()
    .update(defibrillators)
    .set({
      status,
      reviewedAt: new Date(),
      reviewedByEmail: email,
      rejectionReason: status === "rejected" ? reason : null,
    })
    .where(eq(defibrillators.id, id));
  refresh(id);
  redirect(status === "approved" ? `/admin/aed/${id}?approved=1` : "/admin");
}

export async function removePhoto(id: string): Promise<void> {
  await requireAdmin();
  const existing = await getAed(id);
  if (!existing?.photoUrl) return;
  await db().update(defibrillators).set({ photoUrl: null }).where(eq(defibrillators.id, id));
  await photoStorage().delete(existing.photoUrl);
  refresh(id);
}

export async function deleteAed(id: string): Promise<void> {
  await requireAdmin();
  const existing = await getAed(id);
  if (existing) {
    await db().delete(defibrillators).where(eq(defibrillators.id, id));
    if (existing.photoUrl) await photoStorage().delete(existing.photoUrl);
  }
  refresh(id);
  redirect("/admin");
}

export async function updateReport(reportId: string, status: "resolved" | "dismissed" | "open"): Promise<void> {
  const email = await requireAdmin();
  if (!isUuid(reportId)) return;
  await db()
    .update(aedReports)
    .set({
      status,
      resolvedAt: status === "open" ? null : new Date(),
      resolvedByEmail: status === "open" ? null : email,
    })
    .where(eq(aedReports.id, reportId));
  refresh();
}

export async function adminSignOut(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
