/**
 * Flashcard generation — Function Calling for structured output.
 * Model: claude-haiku-4-5-20251001
 * 입력 우선순위: 저장된 요약 → extracted_text
 * Caches result in generated_contents table.
 */
import { createServiceClient } from "@/lib/supabase/service";
import { createAiClient, getApiKey, ApiKeyMissingError, handleAiError } from "@/lib/ai/client";
import { getSummaryContext, NO_LATEX_RULE } from "@/lib/ai/context";

const MODEL = "claude-haiku-4-5-20251001";

interface Params {
  params: Promise<{ documentId: string }>;
}

const generateFlashcardTool = {
  type: "function" as const,
  function: {
    name: "generate_flashcards",
    description: "강의자료 핵심 개념을 암기카드로 생성합니다.",
    parameters: {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: { type: "string", description: "개념 또는 용어 (질문 형식 권장)" },
              back: { type: "string", description: "명확하고 완전한 한 문장 설명" },
              sourcePage: { type: "number" },
            },
            required: ["front", "back"],
          },
        },
      },
      required: ["flashcards"],
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

  if (!force) {
    const { data: cached } = await supabase
      .from("generated_contents")
      .select("content_json")
      .eq("document_id", documentId)
      .eq("content_type", "flashcards")
      .maybeSingle();
    if (cached) {
      try { return Response.json(JSON.parse(cached.content_json)); }
      catch { /* 재생성 */ }
    }
  }

  // 입력 우선순위: 요약 캐시 → extracted_text
  let contextText = await getSummaryContext(documentId, 6000);

  if (!contextText) {
    const { data: doc } = await supabase
      .from("documents")
      .select("extracted_text")
      .eq("id", documentId)
      .maybeSingle();
    if (!doc) return new Response("Not found", { status: 404 });
    contextText = (doc.extracted_text ?? "").slice(0, 6000);
  }

  if (!contextText.trim()) {
    return new Response("플래시카드 생성에 필요한 내용이 없습니다. 먼저 요약을 생성해주세요.", { status: 400 });
  }

  const ai = createAiClient(apiKey);
  let completion;
  try {
    completion = await ai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `당신은 핵심 개념을 암기카드로 만드는 학습 도우미입니다.
${NO_LATEX_RULE}

좋은 암기카드 기준:
- 앞면(front): 용어명 또는 "~란 무엇인가?" 형태의 질문
- 뒷면(back): 한 문장으로 완결된 정의. 개념의 핵심 속성 포함
- 시험에 나올 핵심 개념, 정의, 원리만 포함
- 중요도 순 정렬, 20개 이내

금지 사항:
- 너무 포괄적이거나 당연한 내용
- 강의자료에 없는 내용 추가`,
        },
        {
          role: "user",
          content: `다음 강의자료에서 시험 필수 핵심 개념 암기카드를 만들어줘. 정의가 명확한 개념 위주로 중요도 순으로 정리해줘.\n\n${contextText}`,
        },
      ],
      tools: [generateFlashcardTool],
      tool_choice: { type: "function", function: { name: "generate_flashcards" } },
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
      { document_id: documentId, content_type: "flashcards", content_json: JSON.stringify(result) },
      { onConflict: "document_id,content_type" }
    );
  } catch (e) {
    console.error("[flashcard] DB save failed:", e);
  }

  return Response.json(result);
}
