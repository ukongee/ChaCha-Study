/**
 * Quiz generation — Function Calling for structured output.
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
  const count: number = body.count ?? 5;
  const difficulty: string = body.difficulty ?? "MEDIUM";
  const force: boolean = body.force ?? false;

  if (!force) {
    const { data: cached } = await supabase
      .from("generated_contents")
      .select("content_json")
      .eq("document_id", documentId)
      .eq("content_type", "quiz")
      .maybeSingle();
    if (cached) {
      try { return Response.json(JSON.parse(cached.content_json)); }
      catch { /* 재생성 */ }
    }
  }

  // 입력 우선순위: 요약 캐시 → extracted_text
  let contextText = await getSummaryContext(documentId, 8000);

  if (!contextText) {
    const { data: doc } = await supabase
      .from("documents")
      .select("extracted_text")
      .eq("id", documentId)
      .maybeSingle();
    if (!doc) return new Response("Not found", { status: 404 });
    contextText = (doc.extracted_text ?? "").slice(0, 8000);
  }

  if (!contextText.trim()) {
    return new Response("퀴즈 생성에 필요한 내용이 없습니다. 먼저 요약을 생성해주세요.", { status: 400 });
  }

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
${NO_LATEX_RULE}

다음 기준을 반드시 지켜 문제를 생성하세요:
1. 단순 암기가 아닌 이해 기반 문제 우선
2. 실제 시험에 나올 법한 형태와 표현
3. 오답 선택지는 그럴듯하지만 명확히 틀린 내용으로 구성
4. 개념 간 연결과 비교를 묻는 문제 포함
5. 강의자료에 명시된 내용에만 근거할 것

난이도 정의:
- EASY: 개념 확인 (정의, 특징)
- MEDIUM: 개념 적용 (상황 적용, 비교)
- HARD: 응용 및 추론 (분석, 예외, 심화)

해설 규칙:
- 왜 정답인지 + 왜 각 오답이 틀렸는지 명확히 설명
- 관련 개념의 핵심 원리까지 포함`,
        },
        {
          role: "user",
          content: `다음 강의자료를 바탕으로 ${difficultyDesc} 4지선다 문제 ${count}개를 출제해줘. 각 문제의 선택지와 상세한 해설을 반드시 포함해줘.\n\n${contextText}`,
        },
      ],
      tools: [generateQuizTool],
      tool_choice: { type: "function", function: { name: "generate_quiz" } },
      max_tokens: 4096,
      temperature: 0.5,
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
      { document_id: documentId, content_type: "quiz", content_json: JSON.stringify(result) },
      { onConflict: "document_id,content_type" }
    );
  } catch (e) {
    console.error("[quiz] DB save failed:", e);
  }

  return Response.json(result);
}
