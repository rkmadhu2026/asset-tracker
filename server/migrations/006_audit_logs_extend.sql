-- 006_audit_logs_extend.sql
-- Add type and severity columns to audit_logs for structured querying.
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS type     TEXT NOT NULL DEFAULT 'System';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'Info';
