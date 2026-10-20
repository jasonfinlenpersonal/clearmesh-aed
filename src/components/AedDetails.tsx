import { Clock, KeyRound, MapPin, Navigation, ShieldCheck } from "lucide-react";
import { AccessBadge } from "./AccessBadge";
import { directionsUrl } from "@/lib/geo";
import { ACCESS_HINTS, EMERGENCY_NUMBER } from "@/lib/labels";
import type { PublicAed } from "@/lib/public-aed";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function AedDetails({ aed, distance }: { aed: PublicAed; distance?: string }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-bold leading-tight">{aed.title}</h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <AccessBadge type={aed.accessType} />
          {distance && <span className="text-sm font-medium text-slate-600">{distance} away</span>}
        </div>
        <p className="mt-1 text-sm text-slate-600">{ACCESS_HINTS[aed.accessType]}</p>
      </div>

      <a
        href={directionsUrl(aed.lat, aed.lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary w-full"
      >
        <Navigation className="size-5" aria-hidden />
        Directions
      </a>

      {aed.cabinetLocked && (
        <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong>Locked cabinet.</strong> Call {EMERGENCY_NUMBER} and they will give you the code.
          </span>
        </p>
      )}

      <div className="rounded-lg bg-brand-50 p-3">
        <h3 className="text-sm font-semibold text-brand-800">Where to find it</h3>
        <p className="mt-0.5 whitespace-pre-line">{aed.accessNotes}</p>
      </div>

      {aed.photoUrl && (
        <img
          src={aed.photoUrl}
          alt={`Photo of the AED at ${aed.title}`}
          className="max-h-72 w-full rounded-lg object-cover"
          loading="lazy"
        />
      )}

      <dl className="space-y-2 text-sm">
        {aed.openingHours && (
          <div className="flex gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden />
            <div>
              <dt className="sr-only">Opening hours</dt>
              <dd>{aed.openingHours}</dd>
            </div>
          </div>
        )}
        {aed.address && (
          <div className="flex gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden />
            <div>
              <dt className="sr-only">Address</dt>
              <dd>{aed.address}</dd>
            </div>
          </div>
        )}
        {aed.what3words && (
          <div className="flex gap-2">
            <span className="w-4 shrink-0 text-center font-bold text-red-600" aria-hidden>
              ///
            </span>
            <div>
              <dt className="sr-only">what3words</dt>
              <dd>
                <a
                  href={`https://what3words.com/${aed.what3words.replace(/^\/+/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2"
                >
                  {aed.what3words.replace(/^\/+/, "")}
                </a>
              </dd>
            </div>
          </div>
        )}
        {(aed.guardianName || aed.lastCheckedAt) && (
          <div className="flex gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden />
            <div>
              <dt className="sr-only">Maintained by</dt>
              <dd>
                {aed.guardianName && <>Looked after by {aed.guardianName}. </>}
                {aed.lastCheckedAt && <>Last checked {formatDate(aed.lastCheckedAt)}.</>}
              </dd>
            </div>
          </div>
        )}
      </dl>

      {aed.description && <p className="whitespace-pre-line text-sm text-slate-700">{aed.description}</p>}
    </div>
  );
}
