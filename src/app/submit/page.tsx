import type { Metadata } from "next";
import { SubmitForm } from "@/components/SubmitForm";
import { turnstileSiteKey } from "@/lib/turnstile";

export const metadata: Metadata = { title: "Add an AED" };
export const dynamic = "force-dynamic"; // reads the Turnstile key at runtime

export default function SubmitPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold">Add a defibrillator</h1>
      <p className="mt-1 text-slate-600">
        Know where an AED is? Add it so others can find it in an emergency. A volunteer checks every submission before
        it appears on the map. No account needed.
      </p>
      <SubmitForm siteKey={turnstileSiteKey()} />
    </div>
  );
}
