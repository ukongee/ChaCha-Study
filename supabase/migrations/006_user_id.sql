-- ============================================================
-- 006_user_id.sql
-- Proper user identity: users table + api_key → user_id mapping.
-- Existing documents (api_key_hash) are migrated to user_id so
-- no data is lost when users re-enter their API key.
-- ============================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL    DEFAULT now()
);

-- 2. API key → user mapping (many keys per user possible)
CREATE TABLE IF NOT EXISTS user_api_keys (
  key_hash   text        PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Link documents to users
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);

-- 4. Migrate existing documents:
--    Each unique api_key_hash → one new user → update all matching documents
DO $$
DECLARE
  r            RECORD;
  new_user_id  uuid;
BEGIN
  FOR r IN
    SELECT DISTINCT api_key_hash
    FROM documents
    WHERE api_key_hash IS NOT NULL
      AND user_id IS NULL
  LOOP
    INSERT INTO users (id) VALUES (gen_random_uuid()) RETURNING id INTO new_user_id;

    INSERT INTO user_api_keys (key_hash, user_id)
    VALUES (r.api_key_hash, new_user_id)
    ON CONFLICT (key_hash) DO NOTHING;

    UPDATE documents
    SET user_id = new_user_id
    WHERE api_key_hash = r.api_key_hash
      AND user_id IS NULL;
  END LOOP;
END $$;
