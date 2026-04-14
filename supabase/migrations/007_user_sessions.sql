-- ============================================================
-- 007_user_sessions.sql
-- Server-issued session tokens for secure key-merge support.
-- The client NEVER sends user_id — only api_key + session_token.
-- Server resolves user_id internally from api_key every request.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  token        text        PRIMARY KEY DEFAULT encode(gen_random_bytes(32), 'hex'),
  user_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);
