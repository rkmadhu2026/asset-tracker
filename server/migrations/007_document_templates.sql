-- 007_document_templates.sql
CREATE TABLE IF NOT EXISTS document_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  category    TEXT        NOT NULL DEFAULT 'General',
  content     JSONB       NOT NULL DEFAULT '[]',
  schema      JSONB       NOT NULL DEFAULT '[]',
  settings    JSONB       NOT NULL DEFAULT '{}',
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS document_templates_category_idx ON document_templates (category);
CREATE INDEX IF NOT EXISTS document_templates_created_at_idx ON document_templates (created_at DESC);
