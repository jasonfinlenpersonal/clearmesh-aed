import type { Metadata } from "next";
import { EMERGENCY_NUMBER } from "@/lib/labels";

export const metadata: Metadata = { title: "Offline" };

// Served by the service worker when a page isn't cached and there's no signal.
export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-10 text-center">
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p>
        If someone has collapsed, <a href={`tel:${EMERGENCY_NUMBER}`} className="font-bold underline">call {EMERGENCY_NUMBER}</a>{" "}
        now. Calls to {EMERGENCY_NUMBER} work even without mobile data.
      </p>
      <p className="text-slate-600">
        The map still works offline if you&apos;ve opened it on this device before. Go back to the{" "}
        <a href="/" className="underline">
          map
        </a>
        .
      </p>
    </div>
  );
}
