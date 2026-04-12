-- Quiz sets: 문서당 여러 퀴즈 세트
CREATE TABLE IF NOT EXISTS quiz_sets (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL DEFAULT '퀴즈 세트',
  config_json TEXT        NOT NULL DEFAULT '{}',
  content_json TEXT       NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quiz_sets_document_id_idx ON quiz_sets(document_id);

-- Flashcard sets: 문서당 여러 플래시카드 세트
CREATE TABLE IF NOT EXISTS flashcard_sets (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL DEFAULT '플래시카드 세트',
  config_json TEXT        NOT NULL DEFAULT '{}',
  content_json TEXT       NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS flashcard_sets_document_id_idx ON flashcard_sets(document_id);
