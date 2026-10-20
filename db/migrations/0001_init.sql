-- Initial schema for the AED locator.
-- Applied once by src/lib/migrate.ts at app start (tracked in schema_migrations).

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid() on older Postgres; harmless on 13+

CREATE TYPE aed_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE access_type AS ENUM ('public_24_7', 'business_hours', 'restricted');

CREATE TABLE defibrillators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  access_notes TEXT NOT NULL, -- e.g. "Mounted on external wall next to pharmacy entrance"
  access_type access_type NOT NULL DEFAULT 'public_24_7',
  -- Kept in sync with latitude/longitude by the trigger below.
  location GEOGRAPHY(Point, 4326) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  address TEXT,
  what3words VARCHAR(100), -- e.g. "///gains.worker.bridge"
  photo_url TEXT,          -- storage key, served through /photos/<key>
  status aed_status NOT NULL DEFAULT 'pending',
  submitted_by_name VARCHAR(100),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by_email VARCHAR(255),

  -- Additions beyond the original brief.
  opening_hours TEXT,                                  -- free text, e.g. "Mon-Fri 8am-6pm"
  cabinet_locked BOOLEAN NOT NULL DEFAULT FALSE,       -- code from 000 needed to open
  guardian_name VARCHAR(255),                          -- owner/organisation looking after it
  guardian_contact VARCHAR(255),                       -- admin-only, never sent to the public
  last_checked_at DATE,                                -- last confirmed present and working
  admin_notes TEXT,                                    -- admin-only
  rejection_reason TEXT,                               -- admin-only
  submitter_ip_hash CHAR(64),                          -- salted hash, for rate limits only
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_defib_location ON defibrillators USING GIST(location);
CREATE INDEX idx_defib_status ON defibrillators(status);
CREATE INDEX idx_defib_submitter_recent ON defibrillators(submitter_ip_hash, submitted_at);

CREATE FUNCTION defibrillators_sync_location() RETURNS trigger AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_defibrillators_sync_location
  BEFORE INSERT OR UPDATE ON defibrillators
  FOR EACH ROW EXECUTE FUNCTION defibrillators_sync_location();

-- Public "report a problem" on an approved AED.
CREATE TYPE report_type AS ENUM ('missing', 'not_working', 'moved', 'access_changed', 'other');
CREATE TYPE report_status AS ENUM ('open', 'resolved', 'dismissed');

CREATE TABLE aed_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defibrillator_id UUID NOT NULL REFERENCES defibrillators(id) ON DELETE CASCADE,
  report_type report_type NOT NULL,
  details TEXT,
  status report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_email VARCHAR(255),
  reporter_ip_hash CHAR(64)
);

CREATE INDEX idx_reports_status ON aed_reports(status, created_at);
CREATE INDEX idx_reports_defib ON aed_reports(defibrillator_id);
CREATE INDEX idx_reports_reporter_recent ON aed_reports(reporter_ip_hash, created_at);
