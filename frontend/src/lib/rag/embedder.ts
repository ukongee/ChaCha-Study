/**
 * HuggingFace Inference API - BAAI/bge-m3
 * 다국어(한/영) 임베딩, 1024차원
 */

const HF_API_URL = "https://api-inference.huggingface.co/models/BAAI/bge-m3";
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY!;

async function callHFEmbedding(inputs: string | string[]): Promise<number[][]> {
  const res = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs, normalize: true }),
  });

  if (!res.ok) {
    const err = await res.text();
    // 모델 로딩 중이면 재시도
    if (res.status === 503) {
      await new Promise((r) => setTimeout(r, 20000));
      return callHFEmbedding(inputs);
    }
    throw new Error(`HuggingFace API error: ${res.status} ${err}`);
  }

  const data = await res.json();

  // 단일 입력이면 1D 배열 반환 → 2D로 변환
  if (Array.isArray(data) && typeof data[0] === "number") {
    return [data as number[]];
  }
  return data as number[][];
}

/** 단일 텍스트 임베딩 */
export async function embedText(text: string): Promise<number[]> {
  const result = await callHFEmbedding(text);
  return result[0];
}

/** 배치 임베딩 (API 과부하 방지: 8개씩 처리) */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 8;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await callHFEmbedding(batch);
    results.push(...embeddings);

    // Rate limit 방지
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}
