-- Store raw device configuration (CLI / running config) on infrastructure rows.
ALTER TABLE infrastructure ADD COLUMN IF NOT EXISTS config TEXT;
