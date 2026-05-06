CREATE TABLE IF NOT EXISTS chats (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'text',
  metadata    JSONB,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chats_user_id_ts ON chats (user_id, timestamp);
