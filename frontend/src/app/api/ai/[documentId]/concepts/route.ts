/**
 * Concepts extraction — major concepts with definitions and examples.
 * Model: claude-sonnet-4-6 (deep comprehension + relationship mapping)
 * Caches result in generated_contents table.
 */
import { createServiceClient } from "@/lib/supabase/service";
import { createAiClient, getApiKey, ApiKeyMissingError, handleAiError } from "@/lib/ai/client";

const MODEL = "claude-sonnet-4-6";

interface Params {
  params: Promise<{ documentId: string }>;
}

const conceptsTool = {
  type: "function" as const,
  function: {
    name: "generate_concepts",
    description: "강의자료의 주요 개념을 정의와 예시와 함께 추출합니다.",
    parameters: {
      type: "object",
      properties: {
        concepts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              term: { type: "string", description: "개념/용어명" },
              definition: { type: "string", description: "완전한 정의 (개념의 본질적 속성 포함)" },
              example: { type: "string", description: "구체적 예시 또는 실제 적용 사례" },
              relatedTerms: { type: "array", items: { type: "string" }, description: "연관 개념 목록" },
              sourcePage: { type: "number", description: "출처 페이지" },
            },
            required: ["term", "definition"],
          },
        },
      },
      required: ["concepts"],
    },
  },
};

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
    .select("extracted_text")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc) return new Response("Not found", { status: 404 });

  if (!force) {
    const { data: cached } = await supabase
      .from("generated_contents")
      .select("content_json")
      .eq("document_id", documentId)
      .eq("content_type", "concepts")
      .maybeSingle();
    if (cached) {
      try { return Response.json(JSON.parse(cached.content_json)); }
      catch { /* 재생성 */ }
    }
  }

  const ai = createAiClient(apiKey);
  let completion;
  try {
    completion = await ai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `당신은 강의자료에서 핵심 개념을 추출하고 구조화하는 학습 전문가입니다.

추출 기준:
1. 강의에서 직접 정의하거나 강조한 개념 우선
2. 시험에 출제될 가능성이 높은 개념 포함
3. 개념 간 관계(선수 개념, 연관 개념)를 명확히 표시
4. 정의는 교과서 수준의 정확성으로, 개념의 본질적 특성 포함
5. 예시는 강의에서 언급된 것 또는 이해를 돕는 구체적 사례

금지 사항:
- 강의자료에 없는 내용 추가
- 지나치게 광범위하거나 자명한 개념
- 단순 나열 (반드시 관계와 맥락 포함)`,
        },
        {
          role: "user",
          content: `다음 강의자료에서 핵심 개념을 모두 추출해줘. 중요도 순으로 정렬하고, 개념 → 정의 → 예시 → 관련 개념 구조로 정리해줘.\n\n${(doc.extracted_text ?? "").slice(0, 8000)}`,
        },
      ],
      tools: [conceptsTool],
      tool_choice: { type: "function", function: { name: "generate_concepts" } },
      max_tokens: 4096,
      temperature: 0.3,
    });
  } catch (e) {
    return handleAiError(e);
  }

  const toolCall = completion.choices[0].message.tool_calls?.[0];
  if (!toolCall) return new Response("Function call failed", { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = JSON.parse((toolCall as any).function.arguments);

  try {
    await supabase.from("generated_contents").upsert(
      { document_id: documentId, content_type: "concepts", content_json: JSON.stringify(result) },
      { onConflict: "document_id,content_type" }
    );
  } catch (e) {
    console.error("[concepts] DB save failed:", e);
  }

  return Response.json(result);
}
