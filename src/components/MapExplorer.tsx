"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, LoaderCircle, LocateFixed, Search, X } from "lucide-react";
import { AccessBadge } from "./AccessBadge";
import { AedDetails } from "./AedDetails";
import { AedMap, type FlyTarget } from "./map";
import { useGeolocation } from "./useGeolocation";
import { distanceMetres, formatDistance } from "@/lib/geo";
import { ACCESS_COLOURS, ACCESS_LABELS } from "@/lib/labels";
import type { PublicAed } from "@/lib/public-aed";
import type { AccessType } from "@/lib/schema";

type Place = { label: string; lat: number; lng: number };

export function MapExplorer() {
  const [aeds, setAeds] = useState<PublicAed[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<FlyTarget | null>(null);
  const [searchPoint, setSearchPoint] = useState<Place | null>(null);
  const { location, error: geoError, locating, locate } = useGeolocation();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Place[] | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/aeds")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { aeds: PublicAed[] }) => setAeds(d.aeds))
      .catch(() => setLoadError("Couldn't load AEDs. Check your connection and refresh."))
      .finally(() => setLoaded(true));
  }, []);

  // Centre on the person as soon as we know where they are.
  useEffect(() => {
    if (location) {
      setSearchPoint(null);
      setFlyTo({ lat: location.lat, lng: location.lng, zoom: 15, key: Date.now() });
    }
  }, [location]);

  const origin = searchPoint ?? location;

  const nearest = useMemo(() => {
    if (!origin) return [];
    return aeds
      .map((a) => ({ aed: a, d: distanceMetres(origin.lat, origin.lng, a.lat, a.lng) }))
      .sort((x, y) => x.d - y.d)
      .slice(0, 8);
  }, [aeds, origin]);

  const selected = aeds.find((a) => a.id === selectedId) ?? null;
  const selectedDistance =
    selected && origin ? formatDistance(distanceMetres(origin.lat, origin.lng, selected.lat, selected.lng)) : undefined;

  function select(id: string) {
    setSelectedId(id);
    const a = aeds.find((x) => x.id === id);
    if (a) setFlyTo({ lat: a.lat, lng: a.lng, zoom: 17, key: Date.now() });
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3) return;
    setSearching(true);
    setSearchMessage(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { places: Place[]; message?: string };
      setResults(data.places);
      setSearchMessage(data.message ?? null);
      if (data.places.length === 1) pickPlace(data.places[0]!);
    } catch {
      setSearchMessage("Search failed. Check your connection.");
    } finally {
      setSearching(false);
    }
  }

  function pickPlace(p: Place) {
    setSearchPoint(p);
    setResults(null);
    setSelectedId(null);
    setFlyTo({ lat: p.lat, lng: p.lng, zoom: 15, key: Date.now() });
  }

  return (
    <div className="relative flex-1 md:flex">
      {/* Side panel on desktop, bottom sheet on phones. */}
      <section
        aria-label="AED list"
        className="absolute inset-x-0 bottom-0 z-[600] max-h-[55%] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] md:static md:z-auto md:max-h-none md:w-96 md:shrink-0 md:rounded-none md:border-t-0 md:border-r md:shadow-none"
      >
        {selected ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="size-4" aria-hidden /> Back to list
            </button>
            <AedDetails aed={selected} distance={selectedDistance} />
            <Link
              href={`/aed/${selected.id}`}
              className="flex items-center gap-1 text-sm font-medium text-slate-600 underline underline-offset-2"
            >
              Full details, share or report a problem <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          </div>
        ) : (
          <NearestList
            loaded={loaded}
            loadError={loadError}
            total={aeds.length}
            nearest={nearest}
            hasOrigin={origin !== null}
            originLabel={searchPoint ? "the place you searched" : "you"}
            geoError={geoError}
            locating={locating}
            onLocate={locate}
            onSelect={select}
          />
        )}
      </section>

      <div className="explorer-map absolute inset-0 md:relative md:flex-1">
        <AedMap aeds={aeds} selectedId={selectedId} onSelect={select} userLocation={location} flyTo={flyTo} />

        <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] mx-auto max-w-xl">
          <form onSubmit={runSearch} className="pointer-events-auto flex gap-2" role="search">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suburb, address or ///words"
                aria-label="Search for a place"
                className="field pl-9 shadow-md"
                enterKeyHint="search"
              />
            </div>
            <button type="submit" className="btn-secondary shadow-md" disabled={searching} aria-label="Search">
              {searching ? <LoaderCircle className="size-5 animate-spin" /> : <Search className="size-5" />}
            </button>
            <button
              type="button"
              onClick={locate}
              className="btn-primary shadow-md"
              disabled={locating}
              aria-label="Use my location"
              title="Use my location"
            >
              {locating ? <LoaderCircle className="size-5 animate-spin" /> : <LocateFixed className="size-5" />}
            </button>
          </form>

          {(results || searchMessage) && (
            <div className="pointer-events-auto mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5 text-xs text-slate-500">
                <span>{searchMessage ?? "Choose a place"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setResults(null);
                    setSearchMessage(null);
                  }}
                  aria-label="Close search results"
                >
                  <X className="size-4" />
                </button>
              </div>
              {results && results.length > 1 && (
                <ul>
                  {results.map((p) => (
                    <li key={`${p.lat},${p.lng}`}>
                      <button
                        type="button"
                        onClick={() => pickPlace(p)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        {p.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <Legend />
      </div>
    </div>
  );
}

function NearestList(props: {
  loaded: boolean;
  loadError: string | null;
  total: number;
  nearest: { aed: PublicAed; d: number }[];
  hasOrigin: boolean;
  originLabel: string;
  geoError: string | null;
  locating: boolean;
  onLocate: () => void;
  onSelect: (id: string) => void;
}) {
  const loadError = props.loadError && <p className="text-sm font-medium text-red-700">{props.loadError}</p>;

  if (!props.hasOrigin) {
    return (
      <div className="space-y-3">
        {loadError}
        <h1 className="text-lg font-bold">Find the nearest defibrillator</h1>
        <button type="button" onClick={props.onLocate} className="btn-primary w-full" disabled={props.locating}>
          {props.locating ? <LoaderCircle className="size-5 animate-spin" /> : <LocateFixed className="size-5" />}
          {props.locating ? "Finding you…" : "Use my location"}
        </button>
        {props.geoError && <p className="text-sm text-red-700">{props.geoError}</p>}
        <p className="text-sm text-slate-600">
          Or search for a suburb or address above. {props.loaded && <>{props.total.toLocaleString("en-AU")} AEDs listed so far.</>}
        </p>
        <p className="text-sm text-slate-600">
          Know an AED that isn&apos;t on the map?{" "}
          <Link href="/submit" className="font-medium text-brand-700 underline underline-offset-2">
            Add it
          </Link>
          .
        </p>
      </div>
    );
  }

  if (loadError) return loadError;

  if (props.loaded && props.nearest.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-bold">No AEDs listed yet</h2>
        <p className="text-sm text-slate-600">
          We&apos;re only just getting started. If you know where one is,{" "}
          <Link href="/submit" className="font-medium text-brand-700 underline underline-offset-2">
            please add it
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-bold">Nearest to {props.originLabel}</h2>
      <ul className="divide-y divide-slate-100">
        {props.nearest.map(({ aed, d }) => (
          <li key={aed.id}>
            <button
              type="button"
              onClick={() => props.onSelect(aed.id)}
              className="flex w-full items-start gap-3 py-2.5 text-left hover:bg-slate-50"
            >
              <span className="w-16 shrink-0 pt-0.5 text-right text-sm font-bold text-slate-900">{formatDistance(d)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{aed.title}</span>
                <span className="mt-0.5 block">
                  <AccessBadge type={aed.accessType} />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-500">Distances are in a straight line.</p>
    </div>
  );
}

function Legend() {
  return (
    <div className="absolute right-3 top-16 z-[500] hidden rounded-lg bg-white/95 px-3 py-2 text-xs shadow-md md:block">
      {(Object.keys(ACCESS_LABELS) as AccessType[]).map((t) => (
        <div key={t} className="flex items-center gap-2 py-0.5">
          <span className="size-3 rounded-full border-2 border-white" style={{ background: ACCESS_COLOURS[t] }} />
          {ACCESS_LABELS[t]}
        </div>
      ))}
    </div>
  );
}
