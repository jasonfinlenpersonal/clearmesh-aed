import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import { deleteAed, setStatus, updateReport } from "../../../actions";
import { AdminAedForm } from "@/components/admin/AdminAedForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { requireAdminPage } from "@/lib/admin";
import { getAed, nearbyAeds, reportsForAed } from "@/lib/aeds";
import { REPORT_LABELS } from "@/lib/labels";
import { photoPath } from "@/lib/public-aed";

function when(d: Date | null): string {
  return d ? d.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" }) : "—";
}

export default async function AdminAedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ approved?: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const aed = await getAed(id);
  if (!aed) notFound();
  const [nearby, reports, sp] = await Promise.all([
    nearbyAeds(aed.latitude, aed.longitude, aed.id),
    reportsForAed(aed.id),
    searchParams,
  ]);

  return (
    <div className="space-y-4">
      <Link href="/admin" className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> Back to the list
      </Link>

      {sp.approved && (
        <p className="flex items-center gap-2 rounded-lg bg-brand-50 p-3 text-brand-800">
          <CheckCircle2 className="size-5" aria-hidden /> Approved. It&apos;s now on the public map.
        </p>
      )}

      <div className="flex flex-wrap items-start gap-3">
        <div className="mr-auto">
          <h1 className="text-xl font-bold">{aed.title}</h1>
          <p className="text-sm text-slate-600">
            Status: <strong>{aed.status}</strong> · Submitted {when(aed.submittedAt)}
            {aed.submittedByName && <> by {aed.submittedByName}</>}
            {aed.reviewedAt && (
              <>
                {" "}
                · Reviewed {when(aed.reviewedAt)} by {aed.reviewedByEmail}
              </>
            )}
          </p>
          {aed.status === "rejected" && aed.rejectionReason && (
            <p className="text-sm text-slate-600">Reason: {aed.rejectionReason}</p>
          )}
        </div>
        {aed.status === "approved" && (
          <Link href={`/aed/${aed.id}`} className="btn-secondary text-sm" target="_blank">
            Public page <ExternalLink className="size-4" aria-hidden />
          </Link>
        )}
      </div>

      {nearby.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Possible duplicates within 50 m:</p>
          <ul className="mt-1 list-disc pl-5">
            {nearby.map((n) => (
              <li key={n.id}>
                <Link href={`/admin/aed/${n.id}`} className="underline underline-offset-2">
                  {n.title}
                </Link>{" "}
                ({n.status}, {Math.round(n.distanceM)} m away)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Review decision */}
      <section className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        {aed.status !== "approved" && (
          <form action={setStatus.bind(null, aed.id, "approved")}>
            <button type="submit" className="btn-primary">
              Approve and publish
            </button>
          </form>
        )}
        {aed.status !== "rejected" && (
          <form action={setStatus.bind(null, aed.id, "rejected")} className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="rejectionReason" className="label">
                Reason (admins only)
              </label>
              <input id="rejectionReason" name="rejectionReason" className="field" placeholder="e.g. duplicate, spam" />
            </div>
            <button type="submit" className="btn-secondary">
              {aed.status === "approved" ? "Unpublish (reject)" : "Reject"}
            </button>
          </form>
        )}
        {aed.status !== "pending" && (
          <form action={setStatus.bind(null, aed.id, "pending")}>
            <button type="submit" className="btn-secondary">
              Move back to review
            </button>
          </form>
        )}
        <form action={deleteAed.bind(null, aed.id)} className="ml-auto">
          <ConfirmButton message="Delete this AED and its photo permanently?" className="btn-danger">
            Delete
          </ConfirmButton>
        </form>
      </section>

      <AdminAedForm aed={aed} photoUrl={photoPath(aed.photoUrl)} />

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">Problem reports</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-slate-600">None.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start gap-2 py-2 text-sm">
                <div className="mr-auto">
                  <p className="font-medium">
                    {REPORT_LABELS[r.reportType]} <span className="text-slate-500">({r.status})</span>
                  </p>
                  {r.details && <p className="whitespace-pre-line text-slate-700">{r.details}</p>}
                  <p className="text-xs text-slate-500">{when(r.createdAt)}</p>
                </div>
                {r.status === "open" ? (
                  <>
                    <form action={updateReport.bind(null, r.id, "resolved")}>
                      <button className="btn-secondary px-3 py-1 text-sm">Resolved</button>
                    </form>
                    <form action={updateReport.bind(null, r.id, "dismissed")}>
                      <button className="btn-secondary px-3 py-1 text-sm">Dismiss</button>
                    </form>
                  </>
                ) : (
                  <form action={updateReport.bind(null, r.id, "open")}>
                    <button className="btn-secondary px-3 py-1 text-sm">Reopen</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
