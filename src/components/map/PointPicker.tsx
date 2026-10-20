"use client";

import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { AU_CENTER, AU_ZOOM } from "@/lib/geo";
import { OSM_ATTRIBUTION, OSM_TILES } from "./tiles";

export type Point = { lat: number; lng: number };

type Props = {
  value: Point | null;
  onChange: (p: Point) => void;
  /** Bump `key` to move the view (e.g. after "use my location"). */
  focus?: { lat: number; lng: number; zoom: number; key: number } | null;
};

// An HTML pin, so we don't depend on Leaflet's image paths.
const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18 47C18 47 34 29.5 34 17.5C34 8.4 26.8 1 18 1S2 8.4 2 17.5C2 29.5 18 47 18 47Z" fill="#15803d" stroke="#fff" stroke-width="2"/>
    <path d="M19.5 9 12 20h5l-1.5 9 7.5-11h-5z" fill="#fff"/>
  </svg>`,
  iconSize: [36, 48],
  iconAnchor: [18, 47],
});

function ClickToPlace({ onChange }: { onChange: (p: Point) => void }) {
  useMapEvents({ click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function Focus({ focus }: { focus: Props["focus"] }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.setView([focus.lat, focus.lng], focus.zoom);
  }, [map, focus]);
  return null;
}

export default function PointPicker({ value, onChange, focus }: Props) {
  const [start] = useState(value); // initial view only

  return (
    <MapContainer
      center={start ? [start.lat, start.lng] : AU_CENTER}
      zoom={start ? 17 : AU_ZOOM}
      className="h-full w-full"
    >
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} maxZoom={19} />
      <ClickToPlace onChange={onChange} />
      <Focus focus={focus} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              onChange({ lat: ll.lat, lng: ll.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
