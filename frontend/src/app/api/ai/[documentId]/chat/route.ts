/**
 * RAG chat (AI Tutor):
 * Stage 1: pgvector cosine similarity → top-15 candidates
 * Stage 2: bge-reranker-v2-m3 → top-5 precise results
 * Model: claude-sonnet-4-6 (best contextual QA + source citation)
 */
import { createServiceClient } from "@/lib/supabase/service";
import { createAiClient, getApiKey, ApiKeyMissingError, handleAiError } from "@/lib/ai/client";
import { embedText } from "@/lib/rag/embedder";
import { rerank, type ChunkCandidate } from "@/lib/rag/reranker";

const MODEL = "claude-sonnet-4-6";

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

  const supabase = createServiceClient();
  const body = await req.json();
  const question: string = body.question;

  if (!question?.trim()) return new Response("질문이 비어있습니다.", { status: 400 });

  const { data: doc } = await supabase
    .from("documents")
    .select("id, embedding_status")
    .eq("id", documentId)
    .single();

  if (!doc) return new Response("Not found", { status: 404 });

  if (doc.embedding_status !== "done") {
    return new Response("문서 인덱싱이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.", { status: 409 });
  }

  // Stage 1: vector search
  const queryEmbedding = await embedText(question);
  const { data: candidates, error: searchError } = await supabase.rpc("match_document_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_document_id: documentId,
    match_count: 15,
    match_threshold: 0.3,
  });

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

  // Stage 2: rerank
  const chunkCandidates: ChunkCandidate[] = candidates.map(
    (c: { id: string; content: string; chunk_index: number; page_number: number | null; section_title: string | null; similarity: number }) => ({
      id: c.id,
      content: c.content,
      chunkIndex: c.chunk_index,
      pageNumber: c.page_number,
      sectionTitle: c.section_title,
      similarity: c.similarity,
    })
  );
  const topChunks = await rerank(question, chunkCandidates, 5);

  // Recent history (last 10 messages)
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentHistory = (history ?? []).reverse();

  const contextText = topChunks
    .map((c, i) =>
      `[Chunk ${i + 1}${c.pageNumber ? ` | ${c.pageNumber}페이지` : ""}${c.sectionTitle ? ` | ${c.sectionTitle}` : ""}]\n${c.content}`
    )
    .join("\n\n");

  const ai = createAiClient(apiKey);
  let completion;
  try {
    completion = await ai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `당신은 강의자료 기반 학습 도우미입니다.
규칙:
1. 반드시 아래 [강의자료 Context]에 있는 내용만을 바탕으로 답변하세요.
2. Context에 없는 내용은 "해당 내용은 강의자료에서 확인되지 않습니다."라고 명확히 답하세요.
3. 답변은 핵심을 먼저 설명하고, 필요시 구체적인 내용을 보충하세요.
4. 답변 끝에 참고한 페이지를 "📖 출처: p.XX" 형식으로 반드시 표시하세요.
5. 학생이 이해하기 쉽도록 명확하고 친절하게 설명하세요.

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
  } catch (e) {
    return handleAiError(e);
  }

  const answer = completion.choices[0].message.content ?? "";

  const sources = topChunks
    .filter((c) => c.pageNumber)
    .map((c) => ({
      page: c.pageNumber,
      sectionTitle: c.sectionTitle,
      excerpt: c.content.slice(0, 120) + "...",
    }));

  // Persist conversation
  await supabase.from("chat_messages").insert([
    { document_id: documentId, role: "user", content: question },
    { document_id: documentId, role: "assistant", content: answer, sources: sources.length > 0 ? sources : null },
  ]);

  return Response.json({ role: "assistant", content: answer, sources });
}

export async function GET(_req: Request, { params }: Params) {
  const { documentId } = await params;
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("chat_messages")
    .select("id, role, content, sources, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  return Response.json(data ?? []);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { documentId } = await params;
  const supabase = createServiceClient();

  await supabase.from("chat_messages").delete().eq("document_id", documentId);
  return new Response(null, { status: 204 });
}
