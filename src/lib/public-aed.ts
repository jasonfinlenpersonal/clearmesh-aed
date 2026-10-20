import type { AccessType, Defibrillator } from "./schema";

/** What the public map and detail pages get. Never includes admin-only fields. */
export type PublicAed = {
  id: string;
  title: string;
  description: string | null;
  accessNotes: string;
  accessType: AccessType;
  lat: number;
  lng: number;
  address: string | null;
  what3words: string | null;
  photoUrl: string | null;
  openingHours: string | null;
  cabinetLocked: boolean;
  guardianName: string | null;
  lastCheckedAt: string | null;
};

export function photoPath(key: string | null): string | null {
  return key ? `/photos/${key}` : null;
}

export function toPublicAed(d: Defibrillator): PublicAed {
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    accessNotes: d.accessNotes,
    accessType: d.accessType,
    lat: d.latitude,
    lng: d.longitude,
    address: d.address,
    what3words: d.what3words,
    photoUrl: photoPath(d.photoUrl),
    openingHours: d.openingHours,
    cabinetLocked: d.cabinetLocked,
    guardianName: d.guardianName,
    lastCheckedAt: d.lastCheckedAt,
  };
}
