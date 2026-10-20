import Link from "next/link";
import { HeartPulse, Info, MapPin, Plus } from "lucide-react";
import { SITE_SHORT_NAME } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
        <Link href="/" className="mr-auto flex items-center gap-2 font-bold text-brand-800">
          <HeartPulse className="size-6" aria-hidden />
          <span>{SITE_SHORT_NAME}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link href="/" className="flex items-center gap-1 rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
            <MapPin className="size-4" aria-hidden />
            <span className="hidden sm:inline">Map</span>
          </Link>
          <Link
            href="/submit"
            className="flex items-center gap-1 rounded-md bg-brand-700 px-3 py-1.5 text-white hover:bg-brand-800"
          >
            <Plus className="size-4" aria-hidden />
            Add an AED
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100"
            aria-label="About"
          >
            <Info className="size-4" aria-hidden />
            <span className="hidden sm:inline">About</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
