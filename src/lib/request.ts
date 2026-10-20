import { createHash } from "node:crypto";

// The app is only reachable through clearmesh-edge nginx, which sets
// X-Real-IP from Cloudflare's CF-Connecting-IP (overwriting anything the
// client sent). Without it (local dev) every request shares one bucket.
export function clientIp(req: Request): string {
  return req.headers.get("x-real-ip")?.trim() || "local";
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || process.env.AUTH_SECRET || "dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** Rejects cross-site form posts to the public API. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const expected = process.env.AUTH_URL;
  if (expected) return new URL(expected).origin === origin;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return host !== null && new URL(origin).host === host;
  } catch {
    return false;
  }
}
