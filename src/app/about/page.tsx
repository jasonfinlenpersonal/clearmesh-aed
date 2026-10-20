import type { Metadata } from "next";
import Link from "next/link";
import { EMERGENCY_NUMBER } from "@/lib/labels";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 leading-relaxed">
      <h1 className="text-2xl font-bold">About {SITE_NAME}</h1>

      <section className="rounded-xl bg-red-50 p-4 text-red-900">
        <h2 className="font-bold">In an emergency</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            <strong>Call {EMERGENCY_NUMBER}</strong> straight away. The operator will talk you through what to do.
          </li>
          <li>Start CPR: push hard and fast in the centre of the chest.</li>
          <li>Send someone else to get the nearest AED. Don&apos;t stop CPR to fetch it yourself.</li>
          <li>Turn the AED on and follow its voice instructions. You can&apos;t hurt someone by using one.</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">What this is</h2>
        <p>
          A community map of public defibrillators (AEDs) in Australia. Anyone can add one; volunteers check every
          submission before it goes on the map.
        </p>
        <p className="font-semibold">It&apos;s free, and always will be. No ads, no accounts, no tracking.</p>
        <p>
          Listings come from the public and may be out of date. If an AED is missing or a listing is wrong, open it and
          choose &ldquo;Report a problem&rdquo;.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Your privacy</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your location is used in your browser to find the nearest AED. It isn&apos;t sent to us.</li>
          <li>
            Searches go through our server to OpenStreetMap&apos;s Nominatim service (and what3words for ///addresses).
          </li>
          <li>Photos are re-saved without their location and camera data.</li>
          <li>
            We keep a scrambled (hashed) form of your IP address with submissions and reports, only to stop spam.
          </li>
          <li>Your name, if you give it, is only seen by the volunteers who review submissions.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Credits</h2>
        <p>
          Map data &copy;{" "}
          <a href="https://www.openstreetmap.org/copyright" className="underline underline-offset-2">
            OpenStreetMap contributors
          </a>
          . Address search by{" "}
          <a href="https://nominatim.org/" className="underline underline-offset-2">
            Nominatim
          </a>
          . what3words addresses by{" "}
          <a href="https://what3words.com/" className="underline underline-offset-2">
            what3words
          </a>
          .
        </p>
      </section>

      <p className="text-sm text-slate-500">
        <Link href="/admin" className="underline underline-offset-2">
          Volunteer sign-in
        </Link>
      </p>
    </article>
  );
}
