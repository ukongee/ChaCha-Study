/**
 * Memorization notes — compressed exam-cram content.
 * Model: claude-haiku-4-5-20251001 (fast generation, concise format)
 * Caches result in generated_contents table.
 */
import { createServiceClient } from "@/lib/supabase/service";
import { createAiClient, getApiKey, ApiKeyMissingError, handleAiError } from "@/lib/ai/client";

const MODEL = "claude-haiku-4-5-20251001";

interface Params {
  params: Promise<{ documentId: string }>;
}

const memorizeTool = {
  type: "function" as const,
  function: {
    name: "generate_memorize",
    description: "시험 대비 핵심 암기 노트를 생성합니다.",
    parameters: {
      type: "object",
      properties: {
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "섹션 제목 (강의의 주요 챕터/주제)" },
              mustKnow: { type: "array", items: { type: "string" }, description: "반드시 암기할 핵심 사항 (정의/원리/공식을 완전한 문장으로)" },
              keywords: { type: "array", items: { type: "string" }, description: "핵심 키워드 (용어, 개념명, 인물 등)" },
              tip: { type: "string", description: "시험 대비 팁: 자주 틀리는 포인트 또는 출제 빈도 높은 유형" },
            },
            required: ["title", "mustKnow", "keywords"],
          },
        },
      },
      required: ["sections"],
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
      .eq("content_type", "memorize")
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
          content: `당신은 시험 직전 학생을 위한 핵심 암기 노트 전문가입니다.

작성 기준:
1. 강의를 논리적 섹션으로 나누어 체계적으로 정리
2. mustKnow: 시험에 반드시 나올 내용만. 정의/공식/원리를 완전한 문장으로
3. keywords: 해당 섹션의 핵심 단어 (용어, 이름, 개념명)
4. tip: 헷갈리기 쉬운 부분, 자주 출제되는 유형, 기억법 포함
5. 강의 흐름과 중요도 기준으로 우선순위 반영

금지 사항:
- 강의자료에 없는 내용 추가
- 너무 당연하거나 자명한 내용 포함
- 단순 나열 (맥락과 의미 포함 필수)`,
        },
        {
          role: "user",
          content: `다음 강의자료에서 시험 직전 최종 점검용 암기 노트를 만들어줘. 가장 중요한 내용을 압축해서 섹션별로 정리해줘.\n\n${(doc.extracted_text ?? "").slice(0, 6000)}`,
        },
      ],
      tools: [memorizeTool],
      tool_choice: { type: "function", function: { name: "generate_memorize" } },
      max_tokens: 3000,
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
      { document_id: documentId, content_type: "memorize", content_json: JSON.stringify(result) },
      { onConflict: "document_id,content_type" }
    );
  } catch (e) {
    console.error("[memorize] DB save failed:", e);
  }

  return Response.json(result);
}
