-- ============================================================
-- 005_device_id.sql
-- Replace api_key_hash with device_id for user identification.
-- device_id is a client-generated UUID stored in localStorage,
-- independent of the API key.
-- ============================================================

alter table documents add column if not exists device_id text;

create index if not exists documents_device_id_idx on documents (device_id);
