import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AedDetails } from "@/components/AedDetails";
import { ReportProblem } from "@/components/ReportProblem";
import { SingleAedMap } from "@/components/SingleAedMap";
import { getApprovedAed } from "@/lib/aeds";
import { toPublicAed } from "@/lib/public-aed";
import { turnstileSiteKey } from "@/lib/turnstile";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await getApprovedAed((await params).id);
  if (!row) return { title: "AED not found" };
  return { title: row.title, description: `Defibrillator: ${row.accessNotes}` };
}

export default async function AedPage({ params }: Props) {
  const row = await getApprovedAed((await params).id);
  if (!row) notFound();
  const aed = toPublicAed(row);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 md:grid md:grid-cols-[1fr_1fr] md:gap-6 md:py-8">
      <div className="space-y-4">
        <Link href="/" className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="size-4" aria-hidden /> Back to the map
        </Link>
        <AedDetails aed={aed} />
        <ReportProblem aedId={aed.id} siteKey={turnstileSiteKey()} />
      </div>
      <div className="mt-4 h-72 overflow-hidden rounded-xl border border-slate-200 md:sticky md:top-4 md:mt-0 md:h-[28rem]">
        <SingleAedMap aed={aed} />
      </div>
    </div>
  );
}
