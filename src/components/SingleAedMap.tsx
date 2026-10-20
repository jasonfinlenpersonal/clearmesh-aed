"use client";

import { AedMap } from "./map";
import type { PublicAed } from "@/lib/public-aed";

export function SingleAedMap({ aed }: { aed: PublicAed }) {
  return <AedMap aeds={[aed]} selectedId={aed.id} initialCenter={[aed.lat, aed.lng]} initialZoom={17} />;
}
