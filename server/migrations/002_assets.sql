-- Migration 002: assets, device documents, and additional tables
-- psql -U argus -d argus -f server/migrations/002_assets.sql

-- ── Assets (CMDB — richer shape than infrastructure devices) ──────────────

CREATE TABLE assets (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  type            TEXT,
  manufacturer    TEXT,
  model           TEXT,
  status          TEXT DEFAULT 'Active',
  ip              TEXT,
  serial          TEXT,
  os              TEXT,
  risk            INTEGER,
  warranty        TEXT,
  tags            TEXT[],
  owner           TEXT,
  site_id         TEXT REFERENCES sites(id) ON DELETE SET NULL,
  client_id       TEXT REFERENCES clients(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX assets_site_id   ON assets(site_id);
CREATE INDEX assets_client_id ON assets(client_id);
CREATE INDEX assets_status    ON assets(status);

-- ── Asset Types ────────────────────────────────────────────────────────────

-- Already created in 001 as a stub; add device_types as a separate table.
CREATE TABLE device_types (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Asset Documents ────────────────────────────────────────────────────────

CREATE TABLE asset_documents (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  asset_id    TEXT REFERENCES assets(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  type        TEXT,
  uploaded_by TEXT REFERENCES users(uid) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX asset_documents_asset_id ON asset_documents(asset_id);

-- ── Device (infrastructure) Documents ─────────────────────────────────────

CREATE TABLE device_documents (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  device_id   TEXT REFERENCES infrastructure(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  type        TEXT,
  uploaded_by TEXT REFERENCES users(uid) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX device_documents_device_id ON device_documents(device_id);

-- ── Validation History (extend 001 with more fields) ──────────────────────

ALTER TABLE validation_history ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE validation_history ADD COLUMN IF NOT EXISTS status    TEXT;
ALTER TABLE validation_history ADD COLUMN IF NOT EXISTS message   TEXT;
