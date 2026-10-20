"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { removePhoto, saveAed, type SaveState } from "@/app/admin/actions";
import { PointPicker, type Point } from "@/components/map";
import { ACCESS_LABELS } from "@/lib/labels";
import type { AccessType, Defibrillator } from "@/lib/schema";

export function AdminAedForm({ aed, photoUrl }: { aed: Defibrillator; photoUrl: string | null }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveAed.bind(null, aed.id), { ok: false });
  const [point, setPoint] = useState<Point>({ lat: aed.latitude, lng: aed.longitude });
  const err = (k: string) => state.errors?.[k] && <p className="error-text">{state.errors[k]}</p>;

  return (
    <form action={action} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 lg:grid-cols-2">
      <div className="space-y-2">
        <h2 className="font-semibold">Location</h2>
        <div className="h-80 overflow-hidden rounded-lg border border-slate-300">
          <PointPicker value={point} onChange={setPoint} />
        </div>
        <p className="text-sm text-slate-500">
          Drag the pin to correct it. {point.lat.toFixed(6)}, {point.lng.toFixed(6)} ·{" "}
          <a
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${point.lat},${point.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Street View
          </a>
        </p>
        <input type="hidden" name="latitude" value={point.lat} />
        <input type="hidden" name="longitude" value={point.lng} />
        {err("latitude")}

        <div>
          <label className="label" htmlFor="address">
            Address
          </label>
          <input id="address" name="address" defaultValue={aed.address ?? ""} className="field" />
          {err("address")}
        </div>
        <div>
          <label className="label" htmlFor="what3words">
            what3words
          </label>
          <input id="what3words" name="what3words" defaultValue={aed.what3words ?? ""} className="field" />
          <p className="hint">Leave blank to look it up from the pin (needs W3W_API_KEY).</p>
          {err("what3words")}
        </div>

        <div className="space-y-2">
          <span className="label">Photo</span>
          {photoUrl ? (
            <div className="flex items-start gap-3">
              <a href={photoUrl} target="_blank" rel="noopener noreferrer">
                <img src={photoUrl} alt="Submitted photo" className="max-h-48 rounded-lg" />
              </a>
              <button type="submit" formAction={removePhoto.bind(null, aed.id)} className="btn-secondary text-sm">
                Remove photo
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No photo.</p>
          )}
          <input name="photo" type="file" accept="image/*" className="block text-sm" aria-label="Replace photo" />
          {err("photo")}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Details</h2>
        <div>
          <label className="label" htmlFor="title">
            Name *
          </label>
          <input id="title" name="title" defaultValue={aed.title} required className="field" />
          {err("title")}
        </div>
        <div>
          <label className="label" htmlFor="accessNotes">
            Where exactly *
          </label>
          <textarea id="accessNotes" name="accessNotes" defaultValue={aed.accessNotes} rows={3} className="field" />
          {err("accessNotes")}
        </div>
        <div>
          <label className="label" htmlFor="accessType">
            Access
          </label>
          <select id="accessType" name="accessType" defaultValue={aed.accessType} className="field">
            {(Object.keys(ACCESS_LABELS) as AccessType[]).map((t) => (
              <option key={t} value={t}>
                {ACCESS_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="cabinetLocked" defaultChecked={aed.cabinetLocked} className="size-4 accent-brand-700" />
          Locked cabinet (code from 000)
        </label>
        <div>
          <label className="label" htmlFor="openingHours">
            Opening hours
          </label>
          <input id="openingHours" name="openingHours" defaultValue={aed.openingHours ?? ""} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="description">
            Other details (public)
          </label>
          <textarea id="description" name="description" defaultValue={aed.description ?? ""} rows={2} className="field" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="guardianName">
              Looked after by (public)
            </label>
            <input id="guardianName" name="guardianName" defaultValue={aed.guardianName ?? ""} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="guardianContact">
              Guardian contact (admins only)
            </label>
            <input id="guardianContact" name="guardianContact" defaultValue={aed.guardianContact ?? ""} className="field" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="lastCheckedAt">
            Last checked present and working
          </label>
          <input
            id="lastCheckedAt"
            name="lastCheckedAt"
            type="date"
            defaultValue={aed.lastCheckedAt ?? ""}
            className="field"
          />
          {err("lastCheckedAt")}
        </div>
        <div>
          <label className="label" htmlFor="adminNotes">
            Admin notes (admins only)
          </label>
          <textarea id="adminNotes" name="adminNotes" defaultValue={aed.adminNotes ?? ""} rows={2} className="field" />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending && <LoaderCircle className="size-4 animate-spin" />} Save changes
          </button>
          {state.message && (
            <span className={state.ok ? "text-sm text-brand-700" : "text-sm text-red-700"}>{state.message}</span>
          )}
        </div>
      </div>
    </form>
  );
}
