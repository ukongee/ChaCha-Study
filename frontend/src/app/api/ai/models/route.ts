/**
 * 게이트웨이가 이 API 키로 제공하는 모델 목록 조회 (진단용)
 *
 * 모델 ID가 맞지 않으면 게이트웨이는 본문 없는 404만 돌려주기 때문에,
 * "무엇을 쓸 수 있는지"를 앱 안에서 바로 확인할 수단이 필요하다.
 * 설정 페이지의 "사용 가능한 모델 확인" 버튼이 이 라우트를 호출한다.
 *
 * 키는 헤더로만 받는다 (쿼리스트링에 담으면 서버 로그에 남는다).
 */
import { getApiKey, ApiKeyMissingError, getGatewayBaseUrl } from "@/lib/ai/client";
import { SMART_MODEL, FAST_MODEL, VISION_MODEL, FALLBACK_MODELS } from "@/lib/ai/models";

export async function GET(req: Request) {
  let apiKey: string;
  try {
    apiKey = getApiKey(req);
  } catch (e) {
    if (e instanceof ApiKeyMissingError) return new Response(e.message, { status: 400 });
    throw e;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${getGatewayBaseUrl()}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
  } catch {
    return new Response("AI 게이트웨이에 연결할 수 없습니다.", { status: 502 });
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    return new Response(text || `게이트웨이 오류 (${upstream.status})`, { status: upstream.status });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return new Response(text, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  // 게이트웨이 응답 형태가 { data: [{id}] } 인지 [ ... ] 인지 확정적이지 않아 둘 다 받아준다
  const rows: unknown[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { data?: unknown })?.data)
    ? ((parsed as { data: unknown[] }).data)
    : [];

  const available: string[] = rows
    .map((m) => (typeof m === "string" ? m : (m as { id?: unknown })?.id))
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  return Response.json({
    available,
    // 현재 앱이 실제로 요청하는 모델 — available 목록에 없으면 그게 404의 원인이다
    configured: { smart: SMART_MODEL, fast: FAST_MODEL, vision: VISION_MODEL },
    fallbacks: FALLBACK_MODELS,
    missing: [SMART_MODEL, FAST_MODEL, VISION_MODEL].filter(
      (m, i, arr) => arr.indexOf(m) === i && available.length > 0 && !available.includes(m)
    ),
  });
}
