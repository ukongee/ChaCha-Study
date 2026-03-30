-- ============================================================
-- ChaCha Study - Supabase Schema
-- Embedding: bge-m3 (1024 dims)
-- ============================================================

-- pgvector extension
create extension if not exists vector;

-- ============================================================
-- Profiles (auth.users 확장)
-- ============================================================
create table profiles (
  id         uuid references auth.users on delete cascade primary key,
  email      text,
  name       text,
  department text,
  created_at timestamptz default now()
);

-- ============================================================
-- Documents
-- ============================================================
create table documents (
  id                    uuid default gen_random_uuid() primary key,
  user_id               uuid references auth.users on delete cascade not null,
  original_file_name    text not null,
  file_path             text not null,                          -- Supabase Storage path
  file_type             text not null check (file_type in ('PDF', 'PPT', 'PPTX')),
  extracted_text        text,
  page_count            int  default 0,
  file_size             bigint default 0,
  cached_summary_json   text,
  page_texts_json       text,                                   -- JSON array of per-page texts
  embedding_status      text default 'pending'
                          check (embedding_status in ('pending','processing','done','failed')),
  created_at            timestamptz default now()
);

-- ============================================================
-- Document Chunks (RAG용)
-- bge-m3: 1024차원
-- ============================================================
create table document_chunks (
  id            uuid default gen_random_uuid() primary key,
  document_id   uuid references documents on delete cascade not null,
  content       text    not null,          -- 제목 포함된 청크 본문
  chunk_index   int     not null,
  page_number   int,                       -- 시작 페이지
  section_title text,                      -- 소속 섹션 제목
  embedding     vector(1024)               -- bge-m3
);

-- 코사인 유사도 검색 인덱스
create index document_chunks_embedding_idx
  on document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index document_chunks_document_id_idx
  on document_chunks (document_id);

-- ============================================================
-- Chat Messages
-- ============================================================
create table chat_messages (
  id          uuid default gen_random_uuid() primary key,
  document_id uuid references documents on delete cascade not null,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  sources     jsonb,                       -- [{page, section_title, excerpt}]
  created_at  timestamptz default now()
);

-- ============================================================
-- Community Posts
-- ============================================================
create table posts (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  title      text not null,
  content    text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table post_comments (
  id         uuid default gen_random_uuid() primary key,
  post_id    uuid references posts on delete cascade not null,
  user_id    uuid references auth.users on delete cascade not null,
  content    text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- Course Reviews
-- ============================================================
create table course_reviews (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  course_name text not null,
  professor   text,
  rating      int  check (rating between 1 and 5),
  difficulty  text check (difficulty in ('EASY', 'MEDIUM', 'HARD')),
  exam_type   text,
  content     text,
  created_at  timestamptz default now()
);

-- ============================================================
-- RLS 활성화
-- ============================================================
alter table profiles        enable row level security;
alter table documents       enable row level security;
alter table document_chunks enable row level security;
alter table chat_messages   enable row level security;
alter table posts            enable row level security;
alter table post_comments    enable row level security;
alter table course_reviews  enable row level security;

-- ============================================================
-- RLS 정책
-- ============================================================

-- profiles: 본인만
create policy "profiles: own" on profiles
  for all using (auth.uid() = id);

-- documents: 본인만
create policy "documents: own" on documents
  for all using (auth.uid() = user_id);

-- chunks: 본인 문서만
create policy "chunks: own document" on document_chunks
  for all using (
    document_id in (select id from documents where user_id = auth.uid())
  );

-- chat: 본인 문서만
create policy "chat: own document" on chat_messages
  for all using (
    document_id in (select id from documents where user_id = auth.uid())
  );

-- posts: 인증된 사용자 전체 읽기, 본인만 쓰기
create policy "posts: read" on posts
  for select using (auth.uid() is not null);
create policy "posts: insert" on posts
  for insert with check (auth.uid() = user_id);
create policy "posts: update" on posts
  for update using (auth.uid() = user_id);
create policy "posts: delete" on posts
  for delete using (auth.uid() = user_id);

-- comments: 읽기 공개, 쓰기 본인
create policy "comments: read" on post_comments
  for select using (auth.uid() is not null);
create policy "comments: insert" on post_comments
  for insert with check (auth.uid() = user_id);
create policy "comments: delete" on post_comments
  for delete using (auth.uid() = user_id);

-- reviews: 읽기 공개, 쓰기 본인
create policy "reviews: read" on course_reviews
  for select using (auth.uid() is not null);
create policy "reviews: insert" on course_reviews
  for insert with check (auth.uid() = user_id);
create policy "reviews: delete" on course_reviews
  for delete using (auth.uid() = user_id);

-- ============================================================
-- RAG: 2단계 검색 함수
-- 1단계: cosine similarity로 top_k 후보 검색
-- reranker는 API route에서 처리 후 이 함수로 최종 저장
-- ============================================================
create or replace function match_document_chunks(
  query_embedding   vector(1024),
  match_document_id uuid,
  match_count       int  default 15,       -- 1단계: 넓게 검색
  match_threshold   float default 0.3
)
returns table (
  id            uuid,
  content       text,
  chunk_index   int,
  page_number   int,
  section_title text,
  similarity    float
)
language sql stable
as $$
  select
    id,
    content,
    chunk_index,
    page_number,
    section_title,
    1 - (embedding <=> query_embedding) as similarity
  from document_chunks
  where document_id = match_document_id
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
-- 신규 유저 profile 자동 생성 트리거
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Storage bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict do nothing;

-- storage RLS: 본인 파일만
create policy "storage: own upload" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage: own read" on storage.objects
  for select using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage: own delete" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
