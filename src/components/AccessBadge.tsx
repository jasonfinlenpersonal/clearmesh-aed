import { ACCESS_COLOURS, ACCESS_LABELS } from "@/lib/labels";
import type { AccessType } from "@/lib/schema";

export function AccessBadge({ type }: { type: AccessType }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-medium text-slate-800">
      <span className="size-2.5 rounded-full" style={{ background: ACCESS_COLOURS[type] }} aria-hidden />
      {ACCESS_LABELS[type]}
    </span>
  );
}
