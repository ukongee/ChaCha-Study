-- ── Migration 003: content_type CHECK 제약 확장 ─────────────────────────────
--
-- 추가 항목:
--   exam-points  (시험 포인트 탭)
--   wiki         (AI Tutor 학습용 Wiki)
--
-- 기존 제약을 제거하고 새 제약으로 교체합니다.
-- (PostgreSQL은 CHECK 제약을 ALTER로 직접 수정할 수 없으므로 drop → add)

alter table generated_contents
  drop constraint if exists generated_contents_content_type_check;

alter table generated_contents
  add constraint generated_contents_content_type_check
  check (content_type in (
    'summary',
    'quiz',
    'flashcards',
    'mindmap',
    'memorize',
    'concepts',
    'exam-points',
    'wiki'
  ));
