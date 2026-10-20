"use client";

import { useCallback, useEffect, useState } from "react";

export type Located = { lat: number; lng: number; accuracy: number };

const MESSAGES: Record<number, string> = {
  1: "Location is blocked. Allow it in your browser settings, or search for a place instead.",
  2: "Your location isn't available right now. Try searching for a place instead.",
  3: "Finding your location took too long. Try again, or search for a place.",
};

/**
 * Asks for the device's location. If permission was already granted on an
 * earlier visit it locates straight away: in an emergency every second counts.
 */
export function useGeolocation(autoIfGranted = true) {
  const [location, setLocation] = useState<Located | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("This device can't share its location. Search for a place instead.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocating(false);
      },
      (err) => {
        setError(MESSAGES[err.code] ?? MESSAGES[2]);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  }, []);

  useEffect(() => {
    if (!autoIfGranted || !navigator.permissions?.query) return;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((p) => {
        if (p.state === "granted") locate();
      })
      .catch(() => {});
  }, [autoIfGranted, locate]);

  return { location, error, locating, locate };
}
