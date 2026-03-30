/**
 * HuggingFace Inference API - BAAI/bge-reranker-v2-m3
 * 2단계 검색의 정밀 재정렬 담당
 */

const RERANKER_URL =
  "https://api-inference.huggingface.co/models/BAAI/bge-reranker-v2-m3";
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY!;

export interface ChunkCandidate {
  id: string;
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  sectionTitle: string | null;
  similarity: number;
}

export interface RankedChunk extends ChunkCandidate {
  rerankScore: number;
}

/**
 * bge-reranker로 query-chunk 쌍의 관련도 점수 계산
 * inputs: [[query, chunk1], [query, chunk2], ...]
 */
async function callReranker(pairs: [string, string][]): Promise<number[]> {
  const res = await fetch(RERANKER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: pairs }),
  });

  if (!res.ok) {
    if (res.status === 503) {
      await new Promise((r) => setTimeout(r, 20000));
      return callReranker(pairs);
    }
    throw new Error(`Reranker API error: ${res.status}`);
  }

  const data = await res.json();
  // 응답: [{label, score}] 또는 [score, ...]
  if (Array.isArray(data) && typeof data[0] === "object" && "score" in data[0]) {
    return data.map((d: { score: number }) => d.score);
  }
  return data as number[];
}

/**
 * 후보 청크를 reranker로 재정렬 후 상위 topK만 반환
 */
export async function rerank(
  query: string,
  candidates: ChunkCandidate[],
  topK: number = 5
): Promise<RankedChunk[]> {
  if (candidates.length === 0) return [];
  if (candidates.length <= topK) {
    return candidates.map((c) => ({ ...c, rerankScore: c.similarity }));
  }

  const pairs: [string, string][] = candidates.map((c) => [query, c.content]);

  try {
    const scores = await callReranker(pairs);
    const ranked = candidates
      .map((c, i) => ({ ...c, rerankScore: scores[i] ?? c.similarity }))
      .sort((a, b) => b.rerankScore - a.rerankScore)
      .slice(0, topK);
    return ranked;
  } catch (err) {
    console.warn("Reranker failed, falling back to vector similarity:", err);
    // reranker 실패 시 vector similarity 순으로 fallback
    return candidates
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map((c) => ({ ...c, rerankScore: c.similarity }));
  }
}
