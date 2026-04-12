/**
 * Exam Points API — 시험 대비 포인트 분석
 * Model: claude-sonnet-4-6
 * Output: { examPoints[], confusingConcepts[], memorizationPoints[] }
 * Caches result in generated_contents table.
 */
import { createServiceClient } from "@/lib/supabase/service";
import { createAiClient, getApiKey, ApiKeyMissingError, handleAiError } from "@/lib/ai/client";

const MODEL = "claude-sonnet-4-6";

const EXAM_POINTS_SYSTEM = `당신은 대학교 시험 출제 전문가입니다.

강의자료를 분석하여 시험에 나올 가능성이 높은 내용을 체계적으로 정리하세요.

[분석 기준]
1. examPoints: 시험에 직접 출제될 가능성이 높은 개념, 정의, 공식, 조건
   - 교수가 반복 강조한 내용
   - 정의나 조건이 명확한 개념
   - 다른 개념과 비교되는 내용

2. confusingConcepts: 학생들이 혼동하기 쉬운 유사 개념 쌍
   - 이름은 비슷하지만 의미가 다른 개념
   - 조건이 반대인 개념
   - 자주 틀리는 개념 구분

3. memorizationPoints: 반드시 암기해야 할 내용
   - 공식, 정의, 조건, 법칙
   - 예외 케이스
   - 특정 숫자/기준값

[출력 제한]
- examPoints: 최대 10개
- confusingConcepts: 최대 6개
- memorizationPoints: 최대 10개

반드시 아래 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

{
  "examPoints": [
    {
      "topic": "출제 주제",
      "point": "시험에 나올 핵심 포인트 (완전한 문장)",
      "reason": "왜 출제 가능성이 높은지 한 줄",
      "page": 페이지번호
    }
  ],
  "confusingConcepts": [
    {
      "conceptA": "개념 A 이름",
      "conceptB": "개념 B 이름",
      "difference": "핵심 차이점을 명확하게 설명"
    }
  ],
  "memorizationPoints": [
    {
      "content": "반드시 암기해야 할 내용 (정의/공식/조건을 완전한 문장으로)",
      "page": 페이지번호
    }
  ]
}`;

interface Params {
  params: Promise<{ documentId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { documentId } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("generated_contents")
    .select("content_json")
    .eq("document_id", documentId)
    .eq("content_type", "exam-points")
    .single();
  if (!data) return new Response(null, { status: 404 });
  try { return Response.json(JSON.parse(data.content_json)); }
  catch { return new Response(null, { status: 404 }); }
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
  const body = await req.json().catch(() => ({}));
  const force: boolean = body.force ?? false;

  const { data: doc } = await supabase
    .from("documents")
    .select("extracted_text, page_texts_json")
    .eq("id", documentId)
    .single();

  if (!doc) return new Response("Not found", { status: 404 });

  if (!force) {
    const { data: cached } = await supabase
      .from("generated_contents")
      .select("content_json")
      .eq("document_id", documentId)
      .eq("content_type", "exam-points")
      .single();

    if (cached) {
      try {
        return Response.json(JSON.parse(cached.content_json));
      } catch { /* 재생성 */ }
    }
  }

  // 전체 문서 기준 분석 (최대 10000자)
  const pageTexts: string[] = doc.page_texts_json ? JSON.parse(doc.page_texts_json) : [];
  let contextText: string;
  if (pageTexts.length > 0) {
    contextText = pageTexts
      .slice(0, 15)
      .filter((t) => t?.trim())
      .map((t, i) => `=== ${i + 1}페이지 ===\n${t.slice(0, 800)}`)
      .join("\n\n");
  } else {
    contextText = (doc.extracted_text ?? "").slice(0, 10000);
  }

  const ai = createAiClient(apiKey);
  let completion;
  try {
    completion = await ai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: EXAM_POINTS_SYSTEM },
        {
          role: "user",
          content: `다음 강의자료를 분석하여 시험 대비 포인트를 정리해줘. 출제 가능성이 높은 개념, 헷갈리는 개념 비교, 암기 포인트를 모두 포함해줘.\n\n${contextText}`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    });
  } catch (e) {
    return handleAiError(e);
  }

  const raw = completion.choices[0].message.content ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const resultJson = jsonMatch ? jsonMatch[0] : raw;

  let parsed: unknown;
  try {
    parsed = JSON.parse(resultJson);
  } catch {
    console.error("[exam-points] JSON parse failed, raw length:", raw.length);
    return new Response("AI 응답 처리에 실패했습니다. 다시 시도해주세요.", { status: 500 });
  }

  await supabase.from("generated_contents").upsert(
    { document_id: documentId, content_type: "exam-points", content_json: resultJson },
    { onConflict: "document_id,content_type" }
  );

  return Response.json(parsed);
}
