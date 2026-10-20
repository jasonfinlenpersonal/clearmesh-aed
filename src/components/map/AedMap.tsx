"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, ZoomControl } from "react-leaflet";
import { AU_CENTER, AU_ZOOM } from "@/lib/geo";
import { ACCESS_COLOURS } from "@/lib/labels";
import type { PublicAed } from "@/lib/public-aed";
import { OSM_ATTRIBUTION, OSM_TILES } from "./tiles";

export type FlyTarget = { lat: number; lng: number; zoom: number; key: number };
export type UserLocation = { lat: number; lng: number; accuracy: number };

type Props = {
  aeds: PublicAed[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  userLocation?: UserLocation | null;
  flyTo?: FlyTarget | null;
  initialCenter?: [number, number];
  initialZoom?: number;
  interactive?: boolean;
};

function FlyController({ target }: { target: FlyTarget | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.8 });
  }, [map, target]);
  return null;
}

export default function AedMap({
  aeds,
  selectedId,
  onSelect,
  userLocation,
  flyTo,
  initialCenter = AU_CENTER,
  initialZoom = AU_ZOOM,
  interactive = true,
}: Props) {
  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      preferCanvas // canvas markers stay fast with thousands of AEDs
      className="h-full w-full"
      zoomControl={false}
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      keyboard={interactive}
      attributionControl
    >
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} maxZoom={19} />
      <FlyController target={flyTo} />
      {interactive && <ZoomControl position="bottomright" />}

      {userLocation && (
        <>
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={Math.min(60, Math.max(8, userLocation.accuracy / 4))}
            pathOptions={{ color: "#2563eb", weight: 1, fillOpacity: 0.1 }}
            interactive={false}
          />
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={7}
            pathOptions={{ color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
            interactive={false}
          />
        </>
      )}

      {aeds.map((a) => {
        const selected = a.id === selectedId;
        return (
          <CircleMarker
            key={a.id}
            center={[a.lat, a.lng]}
            radius={selected ? 13 : 9}
            pathOptions={{
              color: selected ? "#0f172a" : "#ffffff",
              weight: selected ? 4 : 2,
              fillColor: ACCESS_COLOURS[a.accessType],
              fillOpacity: 1,
            }}
            eventHandlers={onSelect ? { click: () => onSelect(a.id) } : undefined}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {a.title}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
