/**
 * RAG ingest pipeline:
 * 1. Chunk document text
 * 2. Embed with bge-m3
 * 3. Store in pgvector
 */
import { createServiceClient } from "@/lib/supabase/service";
import { chunkDocument } from "@/lib/rag/chunker";
import { embedBatch } from "@/lib/rag/embedder";

// Vercel: 최대 300초 (Pro) / 로컬 개발에는 영향 없음
export const maxDuration = 300;

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, page_texts_json, extracted_text, embedding_status")
    .eq("id", id)
    .single();

  if (docError || !doc) return new Response("Not found", { status: 404 });
  if (doc.embedding_status === "done") {
    return Response.json({ message: "Already ingested" });
  }

  await supabase.from("documents").update({ embedding_status: "processing" }).eq("id", id);

  try {
    const pageTexts: { page: number; text: string }[] = doc.page_texts_json
      ? JSON.parse(doc.page_texts_json).map((text: string, i: number) => ({ page: i + 1, text }))
      : [{ page: 1, text: doc.extracted_text ?? "" }];

    await supabase.from("document_chunks").delete().eq("document_id", id);

    const chunks = chunkDocument(pageTexts);
    if (chunks.length === 0) throw new Error("No chunks generated");

    const embeddings = await embedBatch(chunks.map((c) => c.content));

    const rows = chunks.map((chunk, i) => ({
      document_id: id,
      content: chunk.content,
      chunk_index: chunk.chunkIndex,
      page_number: chunk.pageNumber,
      section_title: chunk.sectionTitle,
      embedding: JSON.stringify(embeddings[i]),
    }));

    const { error: insertError } = await supabase.from("document_chunks").insert(rows);
    if (insertError) throw new Error(insertError.message);

    await supabase.from("documents").update({ embedding_status: "done" }).eq("id", id);
    return Response.json({ chunkCount: chunks.length });
  } catch (err) {
    await supabase.from("documents").update({ embedding_status: "failed" }).eq("id", id);
    console.error("Ingest error:", err);
    return new Response(err instanceof Error ? err.message : "Ingest failed", { status: 500 });
  }
}
