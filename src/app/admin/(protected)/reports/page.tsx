import Link from "next/link";
import { updateReport } from "../../actions";
import { requireAdminPage } from "@/lib/admin";
import { openReports } from "@/lib/aeds";
import { REPORT_LABELS } from "@/lib/labels";

export default async function ReportsPage() {
  await requireAdminPage();
  const rows = await openReports();

  return (
    <div>
      <h1 className="mb-3 text-xl font-bold">Open problem reports</h1>
      {rows.length === 0 ? (
        <p className="text-slate-600">No open reports.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ report, aedId, aedTitle }) => (
            <li key={report.id} className="flex flex-wrap items-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
              <div className="mr-auto min-w-0">
                <Link href={`/admin/aed/${aedId}`} className="font-semibold underline underline-offset-2">
                  {aedTitle}
                </Link>
                <p className="text-sm font-medium">{REPORT_LABELS[report.reportType]}</p>
                {report.details && <p className="whitespace-pre-line text-sm text-slate-700">{report.details}</p>}
                <p className="text-xs text-slate-500">
                  {report.createdAt.toLocaleString("en-AU", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Australia/Sydney",
                  })}
                </p>
              </div>
              <form action={updateReport.bind(null, report.id, "resolved")}>
                <button className="btn-secondary px-3 py-1 text-sm">Resolved</button>
              </form>
              <form action={updateReport.bind(null, report.id, "dismissed")}>
                <button className="btn-secondary px-3 py-1 text-sm">Dismiss</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
