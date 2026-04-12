-- ============================================================
-- 002_byok_refactor.sql
-- BYOK (Bring Your Own Key) refactor — no auth, no user_id
-- Run this AFTER 001_initial.sql
-- ============================================================

-- Drop community/review/profile tables (no longer needed)
drop table if exists post_comments cascade;
drop table if exists posts cascade;
drop table if exists course_reviews cascade;
drop table if exists profiles cascade;

-- Drop trigger + function for auto profile creation
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ── Drop user_id-dependent policies before removing the column ──
drop policy if exists "documents: own" on documents;
drop policy if exists "chunks: own document" on document_chunks;
drop policy if exists "chat: own document" on chat_messages;

-- ── documents: remove user_id ───────────────────────────────
alter table documents drop constraint if exists documents_user_id_fkey;
alter table documents drop column if exists user_id;

-- ── chat_messages: remove user_id ownership check ──────────
-- (already no user_id column, just document_id)

-- ── generated_contents: cache for AI study tabs ────────────
create table if not exists generated_contents (
  id            uuid default gen_random_uuid() primary key,
  document_id   uuid references documents on delete cascade not null,
  content_type  text not null check (content_type in (
                  'summary', 'quiz', 'flashcards', 'mindmap',
                  'memorize', 'concepts'
                )),
  content_json  text not null,
  created_at    timestamptz default now(),
  unique (document_id, content_type)
);

-- ── notes: editable user notes per document ─────────────────
create table if not exists notes (
  id           uuid default gen_random_uuid() primary key,
  document_id  uuid references documents on delete cascade not null unique,
  content      text not null default '',
  updated_at   timestamptz default now()
);

-- ── Remove all old RLS policies (auth-based) ────────────────
-- documents
drop policy if exists "documents: own" on documents;
-- chunks
drop policy if exists "chunks: own document" on document_chunks;
-- chat
drop policy if exists "chat: own document" on chat_messages;
-- storage
drop policy if exists "storage: own upload" on storage.objects;
drop policy if exists "storage: own read" on storage.objects;
drop policy if exists "storage: own delete" on storage.objects;

-- ── Disable RLS (server uses service role key — bypasses RLS anyway) ──
alter table documents       disable row level security;
alter table document_chunks disable row level security;
alter table chat_messages   disable row level security;

-- ── Enable RLS on new tables but keep open (service role bypasses) ──
-- generated_contents and notes use service role on server, no client access
alter table generated_contents enable row level security;
alter table notes              enable row level security;

-- Block direct browser client access (all access goes through API routes with service role)
create policy "no direct client access" on generated_contents
  for all using (false);

create policy "no direct client access" on notes
  for all using (false);

-- ── Storage: open upload/read/delete (no user check) ────────
create policy "storage: public upload" on storage.objects
  for insert with check (bucket_id = 'documents');

create policy "storage: public read" on storage.objects
  for select using (bucket_id = 'documents');

create policy "storage: public delete" on storage.objects
  for delete using (bucket_id = 'documents');
