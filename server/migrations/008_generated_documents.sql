-- 008_generated_documents.sql
CREATE TABLE IF NOT EXISTS generated_documents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  UUID        REFERENCES document_templates(id) ON DELETE SET NULL,
  name         TEXT        NOT NULL,
  data         JSONB       NOT NULL DEFAULT '{}',
  status       TEXT        NOT NULL DEFAULT 'generated',
  created_by   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS generated_documents_template_id_idx ON generated_documents (template_id);
CREATE INDEX IF NOT EXISTS generated_documents_created_at_idx  ON generated_documents (created_at DESC);
