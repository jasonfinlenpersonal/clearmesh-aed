import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { adminSignOut } from "../actions";
import { requireAdminPage } from "@/lib/admin";
import { statusCounts } from "@/lib/aeds";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdminPage();
  const counts = await statusCounts();

  const tabs = [
    { href: "/admin", label: "To review", n: counts.pending },
    { href: "/admin?status=approved", label: "Approved", n: counts.approved },
    { href: "/admin?status=rejected", label: "Rejected", n: counts.rejected },
    { href: "/admin/reports", label: "Problem reports", n: counts.openReports },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4">
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <nav className="mr-auto flex flex-wrap gap-1 text-sm font-medium">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} className="rounded-md px-3 py-1.5 hover:bg-slate-100">
              {t.label}{" "}
              <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs">{t.n.toLocaleString("en-AU")}</span>
            </Link>
          ))}
        </nav>
        <span className="text-sm text-slate-500">{email}</span>
        <form action={adminSignOut}>
          <button type="submit" className="btn-secondary px-3 py-1.5 text-sm">
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
