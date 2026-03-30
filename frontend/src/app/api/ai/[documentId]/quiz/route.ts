/**
 * 퀴즈 생성 API - Function Calling 사용
 * 구조화된 JSON 출력 보장 (AiResponseParser 불필요)
 */
import { getAuthenticatedUser } from "@/lib/api/auth-helper";
import { createAiClient, getApiKey, ApiKeyMissingError } from "@/lib/ai/client";

interface Params {
  params: Promise<{ documentId: string }>;
}

const generateQuizTool = {
  type: "function" as const,
  function: {
    name: "generate_quiz",
    description: "강의자료를 기반으로 퀴즈 문제를 생성합니다.",
    parameters: {
      type: "object",
      properties: {
        quizzes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["MULTIPLE_CHOICE"] },
              question: { type: "string", description: "문제" },
              options: {
                type: "array",
                items: { type: "string" },
                minItems: 4,
                maxItems: 4,
                description: "보기 4개",
              },
              answer: { type: "string", description: "정답 보기 텍스트" },
              explanation: { type: "string", description: "해설" },
              sourcePage: {
                type: "number",
                description: "근거 페이지 번호 (없으면 null)",
              },
            },
            required: ["type", "question", "options", "answer", "explanation"],
          },
        },
      },
      required: ["quizzes"],
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
  const count: number = body.count ?? 5;
  const difficulty: string = body.difficulty ?? "MEDIUM";
  const model: string = body.model ?? "gpt-4o-mini";

  const { data: doc } = await supabase
    .from("documents")
    .select("extracted_text")
    .eq("id", documentId)
    .eq("user_id", user!.id)
    .single();

  if (!doc) return new Response("Not found", { status: 404 });

  const difficultyDesc =
    difficulty === "EASY" ? "기본 개념을 확인하는 쉬운" :
    difficulty === "HARD" ? "심화 이해와 응용이 필요한 어려운" :
    "적절한 난이도의";

  const ai = createAiClient(apiKey);

  const completion = await ai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `당신은 대학교 시험 문제를 출제하는 전문가입니다.
반드시 제공된 강의자료 내용에만 근거하여 문제를 출제하세요.
강의자료에 없는 내용으로 문제를 만들지 마세요.`,
      },
      {
        role: "user",
        content: `다음 강의자료를 바탕으로 ${difficultyDesc} 문제 ${count}개를 출제해줘.
정답 근거가 되는 페이지도 함께 표시해줘.\n\n${(doc.extracted_text ?? "").slice(0, 6000)}`,
      },
    ],
    tools: [generateQuizTool],
    tool_choice: { type: "function", function: { name: "generate_quiz" } },
    max_tokens: 4096,
    temperature: 0.5,
  });

  const toolCall = completion.choices[0].message.tool_calls?.[0];
  if (!toolCall || toolCall.type !== "function") return new Response("Function call failed", { status: 500 });

  const result = JSON.parse(toolCall.function.arguments);
  return Response.json(result);
}
