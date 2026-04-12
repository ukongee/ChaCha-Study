/**
 * Flashcard Sets — 문서당 복수 플래시카드 세트 생성/조회
 * GET  → 세트 목록 반환
 * POST → 새 세트 생성 (AI 호출)
 */
import { createServiceClient } from "@/lib/supabase/service";
import { createAiClient, getApiKey, ApiKeyMissingError, handleAiError } from "@/lib/ai/client";

const MODEL = "claude-haiku-4-5-20251001";

interface Params { params: Promise<{ documentId: string }> }

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

export async function GET(_req: Request, { params }: Params) {
  const { documentId } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("flashcard_sets")
    .select("id, title, config_json, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });
  return Response.json(data ?? []);
}

export async function POST(req: Request, { params }: Params) {
  const { documentId } = await params;

  let apiKey: string;
  try { apiKey = getApiKey(req); }
  catch (e) {
    if (e instanceof ApiKeyMissingError) return new Response(e.message, { status: 400 });
    throw e;
  }

  const supabase = createServiceClient();
  const body = await req.json().catch(() => ({}));
  const pageFrom: number | undefined = body.pageFrom;
  const pageTo: number | undefined = body.pageTo;

  const { data: doc } = await supabase
    .from("documents")
    .select("extracted_text, page_texts_json")
    .eq("id", documentId)
    .single();
  if (!doc) return new Response("Not found", { status: 404 });

  let contextText: string;
  if (pageFrom && pageTo && doc.page_texts_json) {
    const pageTexts: string[] = JSON.parse(doc.page_texts_json);
    contextText = pageTexts
      .slice(pageFrom - 1, pageTo)
      .filter((t) => t?.trim())
      .map((t, i) => `=== ${pageFrom + i}페이지 ===\n${t.slice(0, 1000)}`)
      .join("\n\n");
  } else {
    contextText = (doc.extracted_text ?? "").slice(0, 6000);
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
앞면(front): 용어명 또는 "~란 무엇인가?" 형태의 질문
뒷면(back): 한 문장으로 완결된 정의. 핵심 속성 포함
시험에 나올 핵심 개념, 정의, 원리, 공식만 포함. 중요도 순 정렬, 20개 이내.`,
        },
        {
          role: "user",
          content: `다음 강의자료에서 시험 필수 핵심 개념 암기카드를 만들어줘.\n\n${contextText}`,
        },
      ],
      tools: [generateFlashcardTool],
      tool_choice: { type: "function", function: { name: "generate_flashcards" } },
      max_tokens: 4096,
      temperature: 0.3,
    });
  } catch (e) { return handleAiError(e); }

  const toolCall = completion.choices[0].message.tool_calls?.[0];
  if (!toolCall) return new Response("Function call failed", { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = JSON.parse((toolCall as any).function.arguments);

  const title = pageFrom && pageTo
    ? `플래시카드 (${pageFrom}-${pageTo}페이지)`
    : `플래시카드 세트`;

  const { data: created, error } = await supabase
    .from("flashcard_sets")
    .insert({
      document_id: documentId,
      title,
      config_json: JSON.stringify(pageFrom && pageTo ? { pageFrom, pageTo } : {}),
      content_json: JSON.stringify(result),
    })
    .select("id, title, config_json, created_at")
    .single();

  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ ...created, flashcards: result.flashcards });
}
