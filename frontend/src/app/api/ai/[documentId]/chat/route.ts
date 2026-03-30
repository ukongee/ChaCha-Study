/**
 * RAG 채팅 API
 * 1단계: pgvector cosine similarity → top-15 후보
 * 2단계: bge-reranker-v2-m3 → top-5 정밀 선별
 * 답변에 출처 페이지 포함
 */
import { getAuthenticatedUser } from "@/lib/api/auth-helper";
import { createAiClient, getApiKey, ApiKeyMissingError } from "@/lib/ai/client";
import { embedText } from "@/lib/rag/embedder";
import { rerank, type ChunkCandidate } from "@/lib/rag/reranker";

interface Params {
  params: Promise<{ documentId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const { documentId } = await params;

  let apiKey: string;
  try {
    apiKey = getApiKey(req);
  } catch (e) {
    if (e instanceof ApiKeyMissingError) return new Response(e.message, { status: 400 });
    throw e;
  }

  const { user, supabase, error } = await getAuthenticatedUser();
  if (error) return error;

  const body = await req.json();
  const question: string = body.question;
  const model: string = body.model ?? "gpt-4o-mini";

  if (!question?.trim()) {
    return new Response("질문이 비어있습니다.", { status: 400 });
  }

  // 문서 소유권 확인
  const { data: doc } = await supabase
    .from("documents")
    .select("id, embedding_status")
    .eq("id", documentId)
    .eq("user_id", user!.id)
    .single();

  if (!doc) return new Response("Not found", { status: 404 });

  if (doc.embedding_status !== "done") {
    return new Response(
      "문서 인덱싱이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.",
      { status: 409 }
    );
  }

  // ── 1단계: 질문 임베딩 + pgvector 검색 (top-15) ──────────────────
  const queryEmbedding = await embedText(question);

  const { data: candidates, error: searchError } = await supabase.rpc(
    "match_document_chunks",
    {
      query_embedding: JSON.stringify(queryEmbedding),
      match_document_id: documentId,
      match_count: 15,
      match_threshold: 0.3,
    }
  );

  if (searchError) {
    console.error("Vector search error:", searchError);
    return new Response("검색 중 오류가 발생했습니다.", { status: 500 });
  }

  if (!candidates || candidates.length === 0) {
    return Response.json({
      role: "assistant",
      content: "문서에서 관련 내용을 찾지 못했습니다. 다른 방식으로 질문해보세요.",
      sources: [],
    });
  }

  // ── 2단계: bge-reranker로 top-5 재정렬 ───────────────────────────
  const chunkCandidates: ChunkCandidate[] = candidates.map(
    (c: {
      id: string;
      content: string;
      chunk_index: number;
      page_number: number | null;
      section_title: string | null;
      similarity: number;
    }) => ({
      id: c.id,
      content: c.content,
      chunkIndex: c.chunk_index,
      pageNumber: c.page_number,
      sectionTitle: c.section_title,
      similarity: c.similarity,
    })
  );

  const topChunks = await rerank(question, chunkCandidates, 5);

  // ── 대화 이력 조회 (최근 10개) ────────────────────────────────────
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentHistory = (history ?? []).reverse();

  // ── Context 구성 (출처 포함) ─────────────────────────────────────
  const contextText = topChunks
    .map(
      (c, i) =>
        `[Chunk ${i + 1}${c.pageNumber ? ` | page ${c.pageNumber}` : ""}${
          c.sectionTitle ? ` | ${c.sectionTitle}` : ""
        }]\n${c.content}`
    )
    .join("\n\n");

  // ── LLM 답변 생성 ────────────────────────────────────────────────
  const ai = createAiClient(apiKey);

  const completion = await ai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `당신은 강의자료 기반 학습 도우미입니다.
반드시 아래 [강의자료 Context]에 있는 내용만을 바탕으로 답변하세요.
Context에 없는 내용은 추측하지 말고 "문서에서 확인되지 않습니다."라고 답하세요.
답변 끝에 참고한 페이지를 "출처: p.XX" 형식으로 표시하세요.

[강의자료 Context]
${contextText}`,
      },
      ...recentHistory.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: question },
    ],
    max_tokens: 1024,
    temperature: 0.3,
  });

  const answer = completion.choices[0].message.content ?? "";

  // ── 출처 메타데이터 ───────────────────────────────────────────────
  const sources = topChunks
    .filter((c) => c.pageNumber)
    .map((c) => ({
      page: c.pageNumber,
      sectionTitle: c.sectionTitle,
      excerpt: c.content.slice(0, 120) + "...",
    }));

  // ── 대화 저장 ─────────────────────────────────────────────────────
  await supabase.from("chat_messages").insert([
    { document_id: documentId, role: "user", content: question },
    {
      document_id: documentId,
      role: "assistant",
      content: answer,
      sources: sources.length > 0 ? sources : null,
    },
  ]);

  return Response.json({ role: "assistant", content: answer, sources });
}

export async function GET(req: Request, { params }: Params) {
  const { documentId } = await params;
  const { user, supabase, error } = await getAuthenticatedUser();
  if (error) return error;

  // 소유권 확인
  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .eq("user_id", user!.id)
    .single();

  if (!doc) return new Response("Not found", { status: 404 });

  const { data } = await supabase
    .from("chat_messages")
    .select("id, role, content, sources, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  return Response.json(data ?? []);
}

export async function DELETE(req: Request, { params }: Params) {
  const { documentId } = await params;
  const { user, supabase, error } = await getAuthenticatedUser();
  if (error) return error;

  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .eq("user_id", user!.id)
    .single();

  if (!doc) return new Response("Not found", { status: 404 });

  await supabase.from("chat_messages").delete().eq("document_id", documentId);
  return new Response(null, { status: 204 });
}
