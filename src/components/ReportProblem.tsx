"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Flag, LoaderCircle } from "lucide-react";
import { Turnstile } from "./Turnstile";
import { REPORT_LABELS } from "@/lib/labels";
import type { ReportType } from "@/lib/schema";

export function ReportProblem({ aedId, siteKey }: { aedId: string; siteKey: string | null }) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [details, setDetails] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const onToken = useCallback((t: string | null) => setToken(t), []);

  if (state === "sent") {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
        <CheckCircle2 className="size-5" aria-hidden /> Thanks. We&apos;ll check it and update the listing.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary w-full">
        <Flag className="size-4" aria-hidden /> Report a problem with this AED
      </button>
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!reportType) {
      setError("Choose what's wrong.");
      return;
    }
    setState("sending");
    setError(null);
    const website = String(new FormData(e.currentTarget as HTMLFormElement).get("website") ?? "");
    try {
      const res = await fetch(`/api/aeds/${aedId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType, details, turnstileToken: token, website }),
      });
      const data = (await res.json()) as { ok: boolean; errors?: Record<string, string> };
      if (data.ok) setState("sent");
      else {
        setError(Object.values(data.errors ?? {})[0] ?? "Something went wrong.");
        setState("idle");
      }
    } catch {
      setError("Couldn't send. Check your connection.");
      setState("idle");
    }
  }

  return (
    <form onSubmit={send} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-semibold">Report a problem</h3>
      <fieldset className="space-y-1.5">
        <legend className="label">What&apos;s wrong?</legend>
        {(Object.keys(REPORT_LABELS) as ReportType[]).map((t) => (
          <label key={t} className="flex items-center gap-2">
            <input
              type="radio"
              name="reportType"
              value={t}
              checked={reportType === t}
              onChange={() => setReportType(t)}
              className="size-4 accent-brand-700"
            />
            {REPORT_LABELS[t]}
          </label>
        ))}
      </fieldset>
      <div>
        <label htmlFor="details" className="label">
          Details (optional)
        </label>
        <textarea
          id="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={1000}
          rows={3}
          className="field"
          placeholder="e.g. Cabinet is empty, or it's now inside the foyer"
        />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <Turnstile siteKey={siteKey} onToken={onToken} />
      {error && <p className="error-text">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={state === "sending"}>
          {state === "sending" && <LoaderCircle className="size-4 animate-spin" />} Send report
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
