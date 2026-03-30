/**
 * 플래시카드 생성 API - Function Calling 사용
 */
import { getAuthenticatedUser } from "@/lib/api/auth-helper";
import { createAiClient, getApiKey, ApiKeyMissingError } from "@/lib/ai/client";

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
              front: { type: "string", description: "개념 또는 용어" },
              back: { type: "string", description: "설명 또는 정의" },
              sourcePage: { type: "number", description: "출처 페이지" },
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

  const { user, supabase, error } = await getAuthenticatedUser();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const model: string = body.model ?? "gpt-4o-mini";

  const { data: doc } = await supabase
    .from("documents")
    .select("extracted_text")
    .eq("id", documentId)
    .eq("user_id", user!.id)
    .single();

  if (!doc) return new Response("Not found", { status: 404 });

  const ai = createAiClient(apiKey);

  const completion = await ai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "당신은 핵심 개념을 암기카드로 만드는 학습 도우미입니다. 강의자료에 있는 내용만 사용하세요.",
      },
      {
        role: "user",
        content: `다음 강의자료에서 핵심 개념 암기카드를 만들어줘. 출처 페이지도 표시해줘.\n\n${(doc.extracted_text ?? "").slice(0, 6000)}`,
      },
    ],
    tools: [generateFlashcardTool],
    tool_choice: { type: "function", function: { name: "generate_flashcards" } },
    max_tokens: 4096,
    temperature: 0.3,
  });

  const toolCall = completion.choices[0].message.tool_calls?.[0];
  if (!toolCall || toolCall.type !== "function") return new Response("Function call failed", { status: 500 });

  const result = JSON.parse(toolCall.function.arguments);
  return Response.json(result);
}
