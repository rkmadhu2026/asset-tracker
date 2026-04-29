-- Argus-asset-tracker — initial PostgreSQL schema
-- Run once against a fresh database:
--   psql -U argus -d argus -f server/migrations/001_initial.sql

-- ── Helpers ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ── Users ──────────────────────────────────────────────────────────────────

CREATE TABLE users (
  uid            TEXT PRIMARY KEY,            -- Firebase UID
  email          TEXT,
  display_name   TEXT,
  photo_url      TEXT,
  role           TEXT NOT NULL DEFAULT 'viewer'
                   CHECK (role IN ('admin','developer','viewer')),
  last_login     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Clients ────────────────────────────────────────────────────────────────

CREATE TABLE clients (
  id                    TEXT PRIMARY KEY,     -- slug-based (e.g. 'finspot', 'indmoney')
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  status                TEXT NOT NULL DEFAULT 'Active'
                          CHECK (status IN ('Active','Inactive','Suspended')),
  parent_client_id      TEXT REFERENCES clients(id) ON DELETE SET NULL,
  legal_name            TEXT,
  address               TEXT,
  website               TEXT,
  primary_contact_email TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Sites ──────────────────────────────────────────────────────────────────

CREATE TABLE sites (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  env         TEXT NOT NULL CHECK (env IN ('PROD','DR','UAT','DEV','ISV')),
  region      TEXT,
  ip          TEXT,
  url         TEXT,
  domain      TEXT,
  status      TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Many-to-many: sites ↔ clients (ISV shared site has 5 client entries)
CREATE TABLE site_clients (
  site_id    TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  client_id  TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  PRIMARY KEY (site_id, client_id)
);
CREATE INDEX site_clients_client_id ON site_clients(client_id);

-- ── Racks ──────────────────────────────────────────────────────────────────

CREATE TABLE racks (
  id          TEXT PRIMARY KEY,
  site_id     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  position    TEXT,
  total_u     INTEGER,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER racks_updated_at BEFORE UPDATE ON racks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX racks_site_id ON racks(site_id);

-- ── Infrastructure (devices) ───────────────────────────────────────────────

CREATE TABLE infrastructure (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  vendor          TEXT NOT NULL,
  model           TEXT NOT NULL,
  type            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'Active'
                    CHECK (status IN ('Active','Warning','Offline')),
  site_id         TEXT REFERENCES sites(id) ON DELETE SET NULL,
  rack_id         TEXT REFERENCES racks(id) ON DELETE SET NULL,
  u_position      TEXT,
  ip              TEXT,
  mask            TEXT,
  gateway         TEXT,
  vlan            TEXT,
  serial          TEXT,
  firmware        TEXT,
  uptime          TEXT,
  cpu             TEXT,
  memory          TEXT,
  temp            TEXT,
  ports           TEXT,
  last_backup     TEXT,
  owner           TEXT,
  criticality     TEXT CHECK (criticality IN ('Critical','High','Medium','Low')),
  purchase_date   TEXT,
  warranty_expiry TEXT,
  assigned_to     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER infrastructure_updated_at BEFORE UPDATE ON infrastructure
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX infrastructure_site_id ON infrastructure(site_id);
CREATE INDEX infrastructure_status  ON infrastructure(status);

-- ── Audit Logs ─────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT REFERENCES users(uid) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  details       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX audit_logs_created_at ON audit_logs(created_at DESC);

-- ── Configuration Tasks ────────────────────────────────────────────────────

CREATE TABLE configuration_tasks (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  priority     TEXT CHECK (priority IN ('Critical','High','Medium','Low')),
  status       TEXT DEFAULT 'Pending',
  device_id    TEXT REFERENCES infrastructure(id) ON DELETE SET NULL,
  assigned_to  TEXT REFERENCES users(uid) ON DELETE SET NULL,
  due_date     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER configuration_tasks_updated_at BEFORE UPDATE ON configuration_tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Drifts ─────────────────────────────────────────────────────────────────

CREATE TABLE drifts (
  id             TEXT PRIMARY KEY,
  device_id      TEXT REFERENCES infrastructure(id) ON DELETE CASCADE,
  field          TEXT,
  expected_value TEXT,
  actual_value   TEXT,
  status         TEXT DEFAULT 'Open' CHECK (status IN ('Open','Resolved','Ignored')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX drifts_device_id ON drifts(device_id);

-- ── Validation History ─────────────────────────────────────────────────────

CREATE TABLE validation_history (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT REFERENCES users(uid) ON DELETE SET NULL,
  device_id    TEXT REFERENCES infrastructure(id) ON DELETE SET NULL,
  result       TEXT,
  details      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Device Templates ───────────────────────────────────────────────────────

CREATE TABLE device_templates (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  vendor      TEXT,
  model       TEXT,
  type        TEXT,
  defaults    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER device_templates_updated_at BEFORE UPDATE ON device_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Asset Types ────────────────────────────────────────────────────────────

CREATE TABLE asset_types (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Convenience view: sites with their client IDs as an array ──────────────

CREATE VIEW sites_with_clients AS
SELECT
  s.*,
  COALESCE(ARRAY_AGG(sc.client_id) FILTER (WHERE sc.client_id IS NOT NULL), '{}') AS client_ids
FROM sites s
LEFT JOIN site_clients sc ON sc.site_id = s.id
GROUP BY s.id;
