# AED Finder Australia (aed.clearmesh.app)

A community map of public defibrillators (AEDs) in Australia. Anyone can find
the nearest AED, add a new one, or report a problem, with no account. Volunteers
sign in with Google to review submissions. Free, forever.

```text
Internet -> Cloudflare (TLS) -> cloudflared -> clearmesh-edge-nginx:80
         -> clearmesh-defib:3000 (Next.js) -> defib-postgres:5432 (PostGIS, internal network)
```

## Stack

| Part | Choice |
| --- | --- |
| App | Next.js 16 (App Router, standalone output), TypeScript, Tailwind CSS 4, lucide-react |
| Map | Leaflet + react-leaflet, OpenStreetMap tiles |
| Database | PostgreSQL 17 + PostGIS 3.6, Drizzle ORM (query builder), plain SQL migrations |
| Auth | Auth.js v5, Google only; access limited to `ADMIN_EMAILS` |
| Search | OpenStreetMap Nominatim (addresses, Australia only); what3words (optional) |
| Photos | Re-encoded to WebP with sharp (metadata/GPS stripped), local disk behind `PhotoStorage` |
| Anti-spam | Same-origin check, honeypot field, per-IP limits in Postgres, optional Cloudflare Turnstile |
| PWA | Manifest + hand-written service worker (`public/sw.js`) |

## What's where

| Path | |
| --- | --- |
| `db/migrations/*.sql` | Schema. Applied in order at start-up by `src/instrumentation-node.ts`, tracked in `schema_migrations` |
| `src/lib/schema.ts` | Drizzle mirror of the schema (without the PostGIS column, which a trigger maintains) |
| `src/app/page.tsx` + `src/components/MapExplorer.tsx` | Public map, nearest list, search, locate |
| `src/app/aed/[id]` | Shareable AED page with "Report a problem" |
| `src/app/submit` + `src/components/SubmitForm.tsx` | Public submission form |
| `src/app/admin` | Review queue, edit/approve/reject/delete, problem reports. Server actions in `actions.ts` |
| `src/app/api/*` | `aeds` (all approved, for map + offline), `submissions`, `aeds/[id]/reports`, `search`, `health` |
| `src/app/photos/[key]` | Serves photos: public once approved, admins only before that |
| `deploy/nginx/aed.conf` | Site config for clearmesh-edge |

### Data model notes

`defibrillators` is the original brief plus: `opening_hours`, `cabinet_locked`
(code from 000), `guardian_name` (public), `guardian_contact` (admin only),
`last_checked_at`, `admin_notes`, `rejection_reason`, `submitter_ip_hash`
(salted SHA-256, for rate limits), `updated_at`. `location` is filled from
`latitude`/`longitude` by a trigger. `aed_reports` holds public problem
reports (missing, not working, moved, access changed, other).

Pending and rejected AEDs, admin-only fields and photos of unapproved AEDs are
never sent to the public.

## Deploying on the server

1. **Data folder** (photos are written by uid 1001 inside the container):

   ```sh
   sudo mkdir -p /srv/clearmesh-defib/uploads
   sudo chown 1001:1001 /srv/clearmesh-defib/uploads
   ```

2. **Config:** `cp .env.example .env` and fill it in. Generate secrets with
   `openssl rand -hex 32` (`POSTGRES_PASSWORD`, `AUTH_SECRET`, `IP_HASH_SALT`).

3. **Google sign-in:** Google Cloud Console → APIs & Services → OAuth consent
   screen (External; app name "AED Finder"; your email) → Credentials → Create
   OAuth client ID → Web application.
   - Authorised JavaScript origin: `https://aed.clearmesh.app`
   - Authorised redirect URI: `https://aed.clearmesh.app/api/auth/callback/google`
   - Put the ID and secret in `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.
   The public site works without this; only `/admin` sign-in needs it.

4. **Start:**

   ```sh
   docker compose up -d --build
   docker compose logs -f app   # expect "[migrate] applied 0001_init.sql"
   ```

5. **Route it** through clearmesh-edge:
   - Copy `deploy/nginx/aed.conf` to `clearmesh-edge/nginx/conf.d/aed.conf`.
   - Add the mount to clearmesh-edge's `docker-compose.yml`:
     `- ./nginx/conf.d/aed.conf:/etc/nginx/conf.d/aed.conf:ro`
   - `docker compose up -d nginx` there (the mount list changed, so recreate rather than reload).
   - Add `aed.clearmesh.app` to the Cloudflare tunnel's public hostnames → `http://clearmesh-edge-nginx:80`.
   - Don't put Cloudflare Access in front of it: the site is public.
   - Add the site to the clearmesh-edge README table.

6. **Check:** open `https://aed.clearmesh.app`, add a test AED, sign in at
   `/admin`, approve it, see it on the map, then delete it.

### Updating

```sh
git pull && docker compose up -d --build app
```

New migrations go in `db/migrations/` as `0002_*.sql` etc. They run once on start-up.

### Backups

Everything worth keeping is in `$DEFIB_DATA_DIR`: the Postgres data and
`uploads/`. A nightly dump is enough:

```sh
docker exec defib-postgres pg_dump -U defib -Fc defib > defib-$(date +%F).dump
```

## Optional services

| Variable | What it turns on |
| --- | --- |
| `W3W_API_KEY` | Adds a ///what3words address to each new submission (looked up once, then stored). Searching *by* ///words uses `convert-to-coordinates`, which what3words may only allow on a paid plan; without it the search box says so politely. |
| `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile on the submit and report forms. Cloudflare dashboard → Turnstile → Add site → `aed.clearmesh.app`, "Managed". |
| `NOMINATIM_EMAIL` | Contact address sent with address lookups, as Nominatim's policy asks for. |

## Local development

Needs Node 22+ and a PostGIS database, e.g.:

```sh
docker run -d --name defib-dev-db -p 127.0.0.1:5433:5432 \
  -e POSTGRES_DB=defib -e POSTGRES_USER=defib -e POSTGRES_PASSWORD=dev postgis/postgis:17-3.6-alpine
```

`.env.local`:

```sh
DATABASE_URL=postgresql://defib:dev@127.0.0.1:5433/defib
AUTH_SECRET=dev-secret
AUTH_URL=http://localhost:3000
ADMIN_EMAILS=you@gmail.com
AUTH_GOOGLE_ID=...        # add http://localhost:3000/api/auth/callback/google to the OAuth client
AUTH_GOOGLE_SECRET=...
```

```sh
npm install
npm run dev        # http://localhost:3000; migrations run on start
npm run typecheck
npm run build
npm run icons      # after editing public/icons/icon.svg
```

The service worker only registers in production builds.

## Usage policies we rely on

- **OSM tiles:** attribution is shown on every map; no bulk prefetching (the
  service worker deliberately doesn't cache tiles).
- **Nominatim:** max 1 request/second (queued server-side), identifying
  User-Agent, results cached for 24 h, search only on submit (no autocomplete).
