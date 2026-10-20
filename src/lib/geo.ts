// Shared by server and browser.

// Mainland Australia plus Tasmania and the external territories
// (Christmas, Cocos, Norfolk, Lord Howe, Macquarie).
export const AU_BOUNDS = { minLat: -55, maxLat: -9, minLng: 96, maxLng: 169 } as const;

// Roughly the middle of the continent; zoom 4 shows all of it on a phone.
export const AU_CENTER: [number, number] = [-25.6, 134.4];
export const AU_ZOOM = 4;

export function inAustralia(lat: number, lng: number): boolean {
  return (
    lat >= AU_BOUNDS.minLat &&
    lat <= AU_BOUNDS.maxLat &&
    lng >= AU_BOUNDS.minLng &&
    lng <= AU_BOUNDS.maxLng
  );
}

/** Great-circle distance in metres. */
export function distanceMetres(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  if (m < 10_000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m / 1000)} km`;
}

export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}

// ///word.word.word, also accepted without the slashes.
export const W3W_PATTERN = /^\/{0,3}([a-z]+)\.([a-z]+)\.([a-z]+)$/i;

export function normaliseW3w(input: string): string | null {
  const m = input.trim().toLowerCase().match(W3W_PATTERN);
  return m ? `///${m[1]}.${m[2]}.${m[3]}` : null;
}
