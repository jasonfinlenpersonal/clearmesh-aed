"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Camera, CheckCircle2, LoaderCircle, LocateFixed } from "lucide-react";
import { PointPicker, type Point } from "./map";
import { Turnstile } from "./Turnstile";
import { useGeolocation } from "./useGeolocation";
import { inAustralia } from "@/lib/geo";
import { ACCESS_COLOURS, ACCESS_HINTS, ACCESS_LABELS } from "@/lib/labels";
import type { AccessType } from "@/lib/schema";

type Errors = Record<string, string>;

/**
 * Phone photos are often 5-15 MB. Shrink big ones in the browser so uploads
 * work on mobile data; the server re-encodes everything anyway.
 */
async function shrinkPhoto(file: File): Promise<Blob> {
  if (file.size < 2 * 1024 * 1024 || !("createImageBitmap" in window)) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

export function SubmitForm({ siteKey }: { siteKey: string | null }) {
  const [point, setPoint] = useState<Point | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom: number; key: number } | null>(null);
  const [accessType, setAccessType] = useState<AccessType>("public_24_7");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [formKey, setFormKey] = useState(0);
  const { location, error: geoError, locating, locate } = useGeolocation(false);
  const onToken = useCallback((t: string | null) => setToken(t), []);

  useEffect(() => {
    if (location) {
      setPoint({ lat: location.lat, lng: location.lng });
      setFocus({ lat: location.lat, lng: location.lng, zoom: 18, key: Date.now() });
    }
  }, [location]);

  useEffect(() => {
    if (!photo) return setPreview(null);
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs: Errors = {};
    if (!point) errs.latitude = "Put a pin on the map where the AED is.";
    else if (!inAustralia(point.lat, point.lng)) errs.latitude = "The pin needs to be in Australia.";
    if (siteKey && !token) errs.form = "Please complete the anti-spam check.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setState("sending");
    const fd = new FormData(e.currentTarget);
    fd.set("latitude", String(point!.lat));
    fd.set("longitude", String(point!.lng));
    fd.set("accessType", accessType);
    fd.delete("photo");
    if (photo) fd.set("photo", await shrinkPhoto(photo), "photo.jpg");
    if (token) fd.set("cf-turnstile-response", token);

    try {
      const res = await fetch("/api/submissions", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({ ok: false }))) as { ok: boolean; errors?: Errors };
      if (data.ok) {
        setState("done");
        window.scrollTo({ top: 0 });
      } else {
        setErrors(data.errors ?? { form: `Something went wrong (${res.status}). Please try again.` });
        setState("idle");
      }
    } catch {
      setErrors({ form: "Couldn't send. Check your connection and try again." });
      setState("idle");
    }
  }

  function reset() {
    setPoint(null);
    setPhoto(null);
    setErrors({});
    setAccessType("public_24_7");
    setState("idle");
    setFormKey((k) => k + 1);
  }

  if (state === "done") {
    return (
      <div className="mt-6 space-y-4 rounded-xl border border-brand-100 bg-brand-50 p-6">
        <p className="flex items-center gap-2 text-lg font-semibold text-brand-800">
          <CheckCircle2 className="size-6" aria-hidden /> Thank you!
        </p>
        <p>We&apos;ll check your submission and add it to the map once it&apos;s been reviewed.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={reset}>
            Add another
          </button>
          <Link href="/" className="btn-secondary">
            Back to the map
          </Link>
        </div>
      </div>
    );
  }

  const err = (k: string) => errors[k] && <p className="error-text">{errors[k]}</p>;

  return (
    <form key={formKey} onSubmit={submit} className="mt-6 space-y-6" noValidate>
      <section className="space-y-2">
        <h2 className="label text-base">1. Where is it?</h2>
        <p className="hint mt-0">Tap the map to drop a pin, then drag it to the exact spot.</p>
        <button type="button" onClick={locate} className="btn-secondary" disabled={locating}>
          {locating ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
          I&apos;m standing next to it
        </button>
        {geoError && <p className="error-text">{geoError}</p>}
        <div className="h-80 overflow-hidden rounded-xl border border-slate-300">
          <PointPicker value={point} onChange={setPoint} focus={focus} />
        </div>
        {point && (
          <p className="text-sm text-slate-500">
            Pin at {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          </p>
        )}
        {err("latitude")}
      </section>

      <section className="space-y-4">
        <h2 className="label text-base">2. Tell us about it</h2>

        <div>
          <label htmlFor="title" className="label">
            Name of the place *
          </label>
          <input id="title" name="title" required maxLength={120} className="field" placeholder="e.g. Smith St Pharmacy" />
          {err("title")}
        </div>

        <div>
          <label htmlFor="accessNotes" className="label">
            Exactly where is the AED? *
          </label>
          <textarea
            id="accessNotes"
            name="accessNotes"
            required
            maxLength={1000}
            rows={3}
            className="field"
            placeholder="e.g. Yellow cabinet on the outside wall, left of the main entrance"
          />
          <p className="hint">Someone in a hurry should be able to find it from this.</p>
          {err("accessNotes")}
        </div>

        <fieldset>
          <legend className="label">Who can get to it? *</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(ACCESS_LABELS) as AccessType[]).map((t) => (
              <label
                key={t}
                className={`cursor-pointer rounded-lg border p-3 text-sm ${
                  accessType === t ? "border-brand-700 bg-brand-50 ring-2 ring-brand-700/20" : "border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="accessTypeChoice"
                  value={t}
                  checked={accessType === t}
                  onChange={() => setAccessType(t)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2 font-semibold">
                  <span className="size-3 rounded-full" style={{ background: ACCESS_COLOURS[t] }} aria-hidden />
                  {ACCESS_LABELS[t]}
                </span>
                <span className="mt-1 block text-slate-600">{ACCESS_HINTS[t]}</span>
              </label>
            ))}
          </div>
          {err("accessType")}
        </fieldset>

        <label className="flex items-start gap-2">
          <input type="checkbox" name="cabinetLocked" className="mt-1 size-4 accent-brand-700" />
          <span>
            <span className="font-medium">It&apos;s in a locked cabinet</span>
            <span className="block text-sm text-slate-500">The kind where 000 gives you the code.</span>
          </span>
        </label>

        <div>
          <label htmlFor="openingHours" className="label">
            Opening hours
          </label>
          <input
            id="openingHours"
            name="openingHours"
            maxLength={200}
            className="field"
            placeholder="e.g. Mon–Fri 8am–6pm, Sat 9am–1pm"
          />
          {err("openingHours")}
        </div>

        <div>
          <label htmlFor="photo" className="label">
            Photo
          </label>
          <label
            htmlFor="photo"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600 hover:bg-slate-50"
          >
            {preview ? (
              <img src={preview} alt="" className="size-16 rounded object-cover" />
            ) : (
              <Camera className="size-6" aria-hidden />
            )}
            <span>{photo ? "Change photo" : "Add a photo of the AED and where it's mounted"}</span>
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
          <p className="hint">Location data is removed from photos. Please avoid people&apos;s faces.</p>
          {err("photo")}
        </div>

        <div>
          <label htmlFor="description" className="label">
            Anything else?
          </label>
          <textarea
            id="description"
            name="description"
            maxLength={2000}
            rows={2}
            className="field"
            placeholder="e.g. Has child pads. Ask staff at the front desk."
          />
          {err("description")}
        </div>

        <details className="rounded-lg border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer font-medium">More details (optional)</summary>
          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="address" className="label">
                Street address
              </label>
              <input id="address" name="address" maxLength={300} className="field" />
              <p className="hint">Leave blank and we&apos;ll look it up from the pin.</p>
              {err("address")}
            </div>
            <div>
              <label htmlFor="what3words" className="label">
                what3words address
              </label>
              <input id="what3words" name="what3words" maxLength={100} className="field" placeholder="///word.word.word" />
              {err("what3words")}
            </div>
            <div>
              <label htmlFor="guardianName" className="label">
                Who looks after it?
              </label>
              <input
                id="guardianName"
                name="guardianName"
                maxLength={200}
                className="field"
                placeholder="e.g. Bondi Surf Club"
              />
              {err("guardianName")}
            </div>
            <div>
              <label htmlFor="submittedByName" className="label">
                Your name
              </label>
              <input id="submittedByName" name="submittedByName" maxLength={100} className="field" autoComplete="name" />
              <p className="hint">Only volunteers reviewing submissions see this.</p>
            </div>
          </div>
        </details>
      </section>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Turnstile siteKey={siteKey} onToken={onToken} />
      {err("form")}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={state === "sending"}>
        {state === "sending" && <LoaderCircle className="size-4 animate-spin" />}
        Submit for review
      </button>
    </form>
  );
}
