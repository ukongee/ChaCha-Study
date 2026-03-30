/**
 * 요약 API
 * Map-Reduce: 섹션별 요약 → 전체 종합
 */
import { getAuthenticatedUser } from "@/lib/api/auth-helper";
import { createAiClient, getApiKey, ApiKeyMissingError } from "@/lib/ai/client";

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

  const { data: doc } = await supabase
    .from("documents")
    .select("id, extracted_text, page_texts_json, cached_summary_json")
    .eq("id", documentId)
    .eq("user_id", user!.id)
    .single();

  if (!doc) return new Response("Not found", { status: 404 });

  // 캐시 확인
  if (doc.cached_summary_json) {
    return Response.json(JSON.parse(doc.cached_summary_json));
  }

  const body = await req.json().catch(() => ({}));
  const model: string = body.model ?? "gpt-4o-mini";

  const pageTexts: string[] = doc.page_texts_json
    ? JSON.parse(doc.page_texts_json)
    : [];

  const ai = createAiClient(apiKey);

  // 페이지 텍스트가 있으면 섹션별 요약(map) → 종합(reduce)
  let contextText: string;
  if (pageTexts.length > 0) {
    const MAX_PAGES = 30;
    const limited = pageTexts.slice(0, MAX_PAGES);
    contextText = limited
      .map((t, i) => `=== ${i + 1}페이지 ===\n${t.slice(0, 400)}`)
      .join("\n\n");
  } else {
    contextText = (doc.extracted_text ?? "").slice(0, 8000);
  }

  const completion = await ai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `당신은 대학교 강의자료를 분석하는 학습 도우미입니다.
반드시 아래 JSON 형식으로만 응답하세요.
{
  "briefSummary": "전체 강의의 핵심을 3줄 이내로 요약",
  "detailedSummary": "강의 전체 내용을 섹션별로 상세하게 설명",
  "keywords": [{"text": "핵심 용어", "page": 페이지번호}],
  "importantPoints": ["시험 포인트1", "포인트2"],
  "pageSummaries": [{"page": 번호, "title": "제목", "summary": "2-3줄 요약"}]
}`,
      },
      {
        role: "user",
        content: `다음 강의자료를 페이지별로 분석하여 JSON으로 요약해줘.\n\n${contextText}`,
      },
    ],
    max_tokens: 4096,
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const summaryJson = jsonMatch ? jsonMatch[0] : raw;

  // 캐시 저장
  await supabase
    .from("documents")
    .update({ cached_summary_json: summaryJson })
    .eq("id", documentId);

  return Response.json(JSON.parse(summaryJson));
}
