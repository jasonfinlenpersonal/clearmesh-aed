import { Phone } from "lucide-react";
import { EMERGENCY_NUMBER } from "@/lib/labels";

export function EmergencyBanner() {
  return (
    <a
      href={`tel:${EMERGENCY_NUMBER}`}
      className="flex items-center justify-center gap-2 bg-emergency px-4 py-2 text-center text-sm font-semibold text-white sm:text-base"
    >
      <Phone className="size-4 shrink-0" aria-hidden />
      <span>
        Someone collapsed? <span className="underline underline-offset-2">Call {EMERGENCY_NUMBER} now</span>{" "}
        and start CPR. Then send someone for the AED.
      </span>
    </a>
  );
}
