/**
 * CNU AI API 클라이언트 (OpenAI 호환)
 * - 사용자 API 키를 헤더로 전달, 서버에 저장하지 않음
 * - Function Calling 지원
 */

import OpenAI from "openai";
import { FALLBACK_MODELS } from "./models";

const DEFAULT_BASE_URL = "https://factchat-cloud.mindlogic.ai/v1/gateway";

/** 게이트웨이 base URL (모델 목록 조회 등 SDK 밖에서도 필요) */
export function getGatewayBaseUrl(): string {
  return process.env.AI_BASE_URL ?? DEFAULT_BASE_URL;
}

export function createAiClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: getGatewayBaseUrl(),
  });
}

/** Request에서 X-AI-Api-Key 헤더 추출 */
export function getApiKey(request: Request): string {
  const key = request.headers.get("X-AI-Api-Key") ?? "";
  if (!key) throw new ApiKeyMissingError();
  return key;
}

export class ApiKeyMissingError extends Error {
  constructor() {
    super("X-AI-Api-Key 헤더가 필요합니다.");
    this.name = "ApiKeyMissingError";
  }
}

type CompletionParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;

/**
 * chat.completions.create 래퍼.
 *
 * 게이트웨이는 제공하지 않는 모델에 대해 본문 없는 404를 반환한다. 그 경우에만
 * FALLBACK_MODELS 순서대로 재시도한다. 404 외의 오류(401/403/413/429/5xx)는
 * 재시도해도 결과가 같으므로 즉시 호출자에게 전달한다.
 */
export async function createCompletion(
  ai: OpenAI,
  params: CompletionParams
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const candidates: string[] = [];
  for (const m of [params.model, ...FALLBACK_MODELS]) {
    if (m && !candidates.includes(m)) candidates.push(m);
  }

  let lastError: unknown;
  for (const model of candidates) {
    try {
      return await ai.chat.completions.create({ ...params, model });
    } catch (e) {
      lastError = e;
      if (e instanceof OpenAI.APIError && e.status === 404) {
        console.warn(`[ai] 모델 "${model}" 이(가) 게이트웨이에 없음 (404) — 다음 후보로 재시도`);
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

/** 게이트웨이가 돌려준 오류 본문에서 사람이 읽을 메시지를 뽑아낸다 */
function gatewayDetail(e: InstanceType<typeof OpenAI.APIError>): string {
  const body: unknown = e.error;
  if (typeof body === "string") return body;
  if (body && typeof body === "object") {
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object") {
      const msg = (detail as { message?: unknown }).message;
      if (typeof msg === "string") return msg;
    }
    const msg = (body as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "";
}

/** OpenAI SDK 오류를 적절한 HTTP Response로 변환 */
export function handleAiError(e: unknown): Response {
  if (e instanceof OpenAI.APIError) {
    const detail = gatewayDetail(e);
    const suffix = detail ? ` — ${detail}` : "";

    const msg =
      e.status === 403
        ? "API 키가 유효하지 않거나 해당 모델에 대한 접근 권한이 없습니다."
        : e.status === 401
        ? "API 키 인증에 실패했습니다."
        : e.status === 413
        ? "요청 데이터가 너무 큽니다. 파일이 너무 크거나 텍스트 분량이 많습니다. 더 작은 파일을 사용해주세요."
        : e.status === 404
        ? `AI 게이트웨이에 요청한 모델이 없습니다. 설정 페이지의 "사용 가능한 모델 확인"으로 목록을 확인한 뒤 AI_SMART_MODEL 환경변수로 교체하세요.${suffix}`
        : `AI API 오류 (${e.status}): ${e.message}${suffix}`;

    // 게이트웨이 404를 그대로 404로 흘리면 "우리 라우트가 없다"는 오해를 부른다 → 502로 매핑
    const status =
      e.status === 413 ? 422 : e.status === 404 ? 502 : (e.status ?? 500);

    return new Response(msg, { status });
  }
  throw e;
}
