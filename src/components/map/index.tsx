"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so the maps only ever render in the browser.

function MapLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">Loading map…</div>
  );
}

export const AedMap = dynamic(() => import("./AedMap"), { ssr: false, loading: MapLoading });
export const PointPicker = dynamic(() => import("./PointPicker"), { ssr: false, loading: MapLoading });

export type { FlyTarget, UserLocation } from "./AedMap";
export type { Point } from "./PointPicker";
