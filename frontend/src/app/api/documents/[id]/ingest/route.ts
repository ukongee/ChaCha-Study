/**
 * RAG 인제스천 파이프라인
 * 1. 문서 텍스트 조회
 * 2. 구조 기반 청킹
 * 3. bge-m3 임베딩 (배치)
 * 4. pgvector 저장
 */
import { getAuthenticatedUser } from "@/lib/api/auth-helper";
import { chunkDocument } from "@/lib/rag/chunker";
import { embedBatch } from "@/lib/rag/embedder";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser();
  if (error) return error;

  // 문서 조회 (소유권 확인)
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, page_texts_json, extracted_text, embedding_status")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (docError || !doc) return new Response("Not found", { status: 404 });
  if (doc.embedding_status === "done") {
    return Response.json({ message: "Already ingested" });
  }

  // 상태 업데이트: processing
  await supabase
    .from("documents")
    .update({ embedding_status: "processing" })
    .eq("id", id);

  try {
    // 페이지별 텍스트 파싱
    const pageTexts: { page: number; text: string }[] = doc.page_texts_json
      ? JSON.parse(doc.page_texts_json).map((text: string, i: number) => ({
          page: i + 1,
          text,
        }))
      : [{ page: 1, text: doc.extracted_text ?? "" }];

    // 기존 청크 삭제 (재인제스트 대비)
    await supabase.from("document_chunks").delete().eq("document_id", id);

    // 구조 기반 청킹
    const chunks = chunkDocument(pageTexts);
    if (chunks.length === 0) {
      throw new Error("No chunks generated");
    }

    // bge-m3 배치 임베딩
    const contents = chunks.map((c) => c.content);
    const embeddings = await embedBatch(contents);

    // pgvector 저장
    const rows = chunks.map((chunk, i) => ({
      document_id: id,
      content: chunk.content,
      chunk_index: chunk.chunkIndex,
      page_number: chunk.pageNumber,
      section_title: chunk.sectionTitle,
      embedding: JSON.stringify(embeddings[i]),
    }));

    const { error: insertError } = await supabase
      .from("document_chunks")
      .insert(rows);

    if (insertError) throw new Error(insertError.message);

    // 완료
    await supabase
      .from("documents")
      .update({ embedding_status: "done" })
      .eq("id", id);

    return Response.json({ chunkCount: chunks.length });
  } catch (err) {
    await supabase
      .from("documents")
      .update({ embedding_status: "failed" })
      .eq("id", id);

    console.error("Ingest error:", err);
    return new Response(
      err instanceof Error ? err.message : "Ingest failed",
      { status: 500 }
    );
  }
}
