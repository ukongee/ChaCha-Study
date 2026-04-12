/**
 * CNU AI API 클라이언트 (OpenAI 호환)
 * - 사용자 API 키를 헤더로 전달, 서버에 저장하지 않음
 * - Function Calling 지원
 */

import OpenAI from "openai";

export function createAiClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: process.env.AI_BASE_URL ?? "https://factchat-cloud.mindlogic.ai/v1/gateway",
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

/** OpenAI SDK 오류를 적절한 HTTP Response로 변환 */
export function handleAiError(e: unknown): Response {
  if (e instanceof OpenAI.APIError) {
    const msg =
      e.status === 403
        ? "API 키가 유효하지 않거나 해당 모델에 대한 접근 권한이 없습니다."
        : e.status === 401
        ? "API 키 인증에 실패했습니다."
        : `AI API 오류 (${e.status}): ${e.message}`;
    return new Response(msg, { status: e.status ?? 500 });
  }
  throw e;
}
