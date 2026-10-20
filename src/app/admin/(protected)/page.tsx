import Link from "next/link";
import { Camera, KeyRound } from "lucide-react";
import { AccessBadge } from "@/components/AccessBadge";
import { requireAdminPage } from "@/lib/admin";
import { listByStatus } from "@/lib/aeds";
import { photoPath } from "@/lib/public-aed";
import { aedStatus, type AedStatus } from "@/lib/schema";

const HEADINGS: Record<AedStatus, string> = {
  pending: "Waiting for review",
  approved: "Approved (on the map)",
  rejected: "Rejected",
};

function when(d: Date | null): string {
  return d ? d.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" }) : "";
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdminPage(); // layouts alone are not an auth boundary
  const raw = (await searchParams).status;
  const status: AedStatus = (aedStatus.enumValues as readonly string[]).includes(raw ?? "") ? (raw as AedStatus) : "pending";
  const rows = await listByStatus(status);

  return (
    <div>
      <h1 className="mb-3 text-xl font-bold">{HEADINGS[status]}</h1>
      {rows.length === 0 ? (
        <p className="text-slate-600">{status === "pending" ? "Nothing to review. 🎉" : "None yet."}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/aed/${r.id}`}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-brand-600"
              >
                {r.photoUrl ? (
                  <img src={photoPath(r.photoUrl)!} alt="" className="size-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                    <Camera className="size-6" aria-hidden />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate font-semibold">{r.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <AccessBadge type={r.accessType} />
                    {r.cabinetLocked && <KeyRound className="size-4 text-amber-700" aria-label="Locked cabinet" />}
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">{r.accessNotes}</p>
                  <p className="text-xs text-slate-500">
                    Submitted {when(r.submittedAt)}
                    {r.submittedByName && <> by {r.submittedByName}</>}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
