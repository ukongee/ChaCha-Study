/**
 * HuggingFace Inference API
 * Model: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
 * 한/영 다국어 지원, 768차원, 경량 모델 (118M params)
 */

const HF_API_URL =
  "https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2";
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY!;

const FETCH_TIMEOUT_MS = 30_000; // 30초
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 12_000;   // 12초

async function callHFEmbedding(
  inputs: string | string[],
  attempt = 0
): Promise<number[][]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs }),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    const isAbort = err instanceof Error && err.name === "AbortError";
    throw new Error(
      isAbort ? `HuggingFace 요청 타임아웃 (${FETCH_TIMEOUT_MS / 1000}초 초과)` : String(err)
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");

    if (res.status === 503 && attempt < MAX_RETRIES) {
      console.warn(`[Embedder] 모델 로딩 중, ${attempt + 1}/${MAX_RETRIES}회 재시도...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return callHFEmbedding(inputs, attempt + 1);
    }

    throw new Error(`HuggingFace API 오류: ${res.status} ${errText.slice(0, 200)}`);
  }

  const data = await res.json();

  // 단일 입력 → 1D 배열 반환 시 2D로 변환
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

/** 배치 임베딩 (8개씩 처리) */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 8;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await callHFEmbedding(batch);
    results.push(...embeddings);

    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}
