-- ============================================================
-- 004_api_key_hash.sql
-- Add api_key_hash to documents for per-user isolation (BYOK)
-- ============================================================

alter table documents add column if not exists api_key_hash text;

create index if not exists documents_api_key_hash_idx on documents (api_key_hash);
