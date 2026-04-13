/**
 * Mindmap generation — direct JSON parsing (function calling 미사용)
 * Model: claude-sonnet-4-6
 * 입력 우선순위: 저장된 요약 → extracted_text
 * Caches result in generated_contents table.
 */
import { createServiceClient } from "@/lib/supabase/service";
import { createAiClient, getApiKey, ApiKeyMissingError, handleAiError } from "@/lib/ai/client";
import { getSummaryContext, NO_LATEX_RULE } from "@/lib/ai/context";

const MODEL = "claude-sonnet-4-6";

interface Params {
  params: Promise<{ documentId: string }>;
}

const SYSTEM_PROMPT = `당신은 강의자료를 NotebookLM 수준의 풍부한 마인드맵으로 구조화하는 전문가입니다.
${NO_LATEX_RULE}

[핵심 원칙]
1. 페이지 순서 나열 금지 — 개념 중심으로 재구성
2. 비슷한 개념은 반드시 한 그룹으로 묶기
3. 정의·종류·관계·변형·응용 등 자연스러운 축으로 분류
4. 단편적인 leaf 노드 남발 금지 — 중간 레벨 노드를 충분히 생성

[계층 구조 — 반드시 준수]
• root(0단계): 강의 전체 핵심 주제 (1개)
• 1단계(대주제): 강의의 주요 개념 축 4~8개
• 2단계(중간 개념): 각 대주제당 반드시 2~6개 생성 — 생략 불가
• 3단계(세부 항목): 중요한 개념은 1~4개 — 권장
• 4단계(심화): 꼭 필요한 경우만 1~3개

[노드 작성 규칙]
• label: 핵심 개념어, 15자 이내
• summary: 개념 한 줄 설명, 50자 이내 — 모든 노드에 필수

[금지 사항]
• "1페이지", "2장" 등 페이지·챕터 번호 사용 금지
• 단순 키워드 나열 금지 — 의미 있는 개념 단위로
• 2단계 진행 없이 leaf만 있는 대주제 금지

반드시 순수 JSON만 응답하세요. 다른 텍스트·마크다운 절대 금지.

{
  "title": "강의 핵심 주제",
  "summary": "강의 전체 한 줄 요약",
  "children": [
    {
      "label": "대주제",
      "summary": "한 줄 설명",
      "children": [
        {
          "label": "중간 개념",
          "summary": "한 줄 설명",
          "children": [
            { "label": "세부 항목", "summary": "한 줄 설명" }
          ]
        }
      ]
    }
  ]
}`;

export async function GET(_req: Request, { params }: Params) {
  const { documentId } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("generated_contents")
    .select("content_json")
    .eq("document_id", documentId)
    .eq("content_type", "mindmap")
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

  if (!force) {
    const { data: cached } = await supabase
      .from("generated_contents")
      .select("content_json")
      .eq("document_id", documentId)
      .eq("content_type", "mindmap")
      .single();
    if (cached) {
      try { return Response.json(JSON.parse(cached.content_json)); }
      catch { /* 재생성 */ }
    }
  }

  // 입력 우선순위: 요약 캐시 → extracted_text
  let contextText = await getSummaryContext(documentId, 10000);

  if (!contextText) {
    const { data: doc } = await supabase
      .from("documents")
      .select("extracted_text")
      .eq("id", documentId)
      .single();

    if (!doc) return new Response("Not found", { status: 404 });
    contextText = (doc.extracted_text ?? "").slice(0, 10000);
  }

  if (!contextText.trim()) {
    return new Response("마인드맵 생성에 필요한 내용이 없습니다. 먼저 요약을 생성해주세요.", { status: 400 });
  }

  const ai = createAiClient(apiKey);
  let completion;
  try {
    completion = await ai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `다음 강의자료를 개념 중심의 계층적 마인드맵으로 구조화해줘.

요구사항:
- 페이지 순서가 아니라 개념 간 관계와 논리적 흐름 중심으로
- 대주제 4~8개, 각 대주제 아래 중간 개념 2~6개 반드시 생성
- 정의·종류·조건·관계·변형·응용 등 자연스러운 축으로 묶기
- 3~4단계 깊이까지 허용, 중간 레벨 노드 풍부하게
- 모든 노드에 label(15자 이내)과 summary(50자 이내) 작성
- 순수 JSON만 반환, 다른 텍스트 절대 포함 금지

강의자료:
${contextText}`,
        },
      ],
      max_tokens: 4500,
      temperature: 0.3,
    });
  } catch (e) {
    return handleAiError(e);
  }

  const raw = completion.choices[0].message.content ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : raw;

  let result: unknown;
  try {
    result = JSON.parse(jsonStr);
  } catch {
    console.error("[mindmap] JSON parse failed, raw length:", raw.length);
    return new Response("AI 응답 처리에 실패했습니다. 다시 시도해주세요.", { status: 500 });
  }

  await supabase.from("generated_contents").upsert(
    { document_id: documentId, content_type: "mindmap", content_json: JSON.stringify(result) },
    { onConflict: "document_id,content_type" }
  );

  return Response.json(result);
}
