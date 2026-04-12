/**
 * Quiz Sets — 문서당 복수 퀴즈 세트 생성/조회
 * GET  → 세트 목록 반환
 * POST → 새 세트 생성 (AI 호출)
 */
import { createServiceClient } from "@/lib/supabase/service";
import { createAiClient, getApiKey, ApiKeyMissingError, handleAiError } from "@/lib/ai/client";

const MODEL = "claude-sonnet-4-6";

interface Params { params: Promise<{ documentId: string }> }

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
              question: { type: "string" },
              options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
              answer: { type: "string" },
              explanation: { type: "string" },
              sourcePage: { type: "number" },
            },
            required: ["type", "question", "options", "answer", "explanation"],
          },
        },
      },
      required: ["quizzes"],
    },
  },
};

export async function GET(_req: Request, { params }: Params) {
  const { documentId } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("quiz_sets")
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
  const count: number = body.count ?? 5;
  const difficulty: string = body.difficulty ?? "MEDIUM";

  const { data: doc } = await supabase
    .from("documents")
    .select("extracted_text")
    .eq("id", documentId)
    .single();
  if (!doc) return new Response("Not found", { status: 404 });

  const difficultyDesc =
    difficulty === "EASY" ? "개념 확인 수준의 쉬운 (정의, 특징 암기)" :
    difficulty === "HARD" ? "응용 및 추론이 필요한 어려운 (개념 적용, 비교 분석, 예외 케이스)" :
    "개념 적용 수준의 중간 (이해 기반, 실제 상황 적용)";

  const ai = createAiClient(apiKey);
  let completion;
  try {
    completion = await ai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `당신은 대학교 시험 문제를 출제하는 교수입니다.
단순 암기가 아닌 이해 기반 문제 우선, 실제 시험에 나올 법한 형태로 출제하세요.
오답 선택지는 그럴듯하지만 명확히 틀린 내용으로 구성하고,
왜 정답인지 + 왜 각 오답이 틀렸는지 명확히 해설하세요.`,
        },
        {
          role: "user",
          content: `다음 강의자료를 바탕으로 ${difficultyDesc} 4지선다 문제 ${count}개를 출제해줘.\n\n${(doc.extracted_text ?? "").slice(0, 8000)}`,
        },
      ],
      tools: [generateQuizTool],
      tool_choice: { type: "function", function: { name: "generate_quiz" } },
      max_tokens: 4096,
      temperature: 0.5,
    });
  } catch (e) { return handleAiError(e); }

  const toolCall = completion.choices[0].message.tool_calls?.[0];
  if (!toolCall) return new Response("Function call failed", { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = JSON.parse((toolCall as any).function.arguments);

  const diffLabel = difficulty === "EASY" ? "쉬움" : difficulty === "HARD" ? "어려움" : "보통";
  const title = `퀴즈 ${count}문제 (${diffLabel})`;

  const { data: created, error } = await supabase
    .from("quiz_sets")
    .insert({
      document_id: documentId,
      title,
      config_json: JSON.stringify({ count, difficulty }),
      content_json: JSON.stringify(result),
    })
    .select("id, title, config_json, created_at")
    .single();

  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ ...created, quizzes: result.quizzes });
}
