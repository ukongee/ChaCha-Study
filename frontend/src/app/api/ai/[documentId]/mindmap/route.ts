/**
 * Mindmap generation — function calling으로 JSON 구조 보장.
 * Model: claude-sonnet-4-6
 * Caches result in generated_contents table.
 */
import { createServiceClient } from "@/lib/supabase/service";
import { createAiClient, getApiKey, ApiKeyMissingError, handleAiError } from "@/lib/ai/client";

const MODEL = "claude-sonnet-4-6";

interface Params {
  params: Promise<{ documentId: string }>;
}

// Recursive schema helper
function nodeSchema(depth: number): object {
  const base: Record<string, object> = {
    label: { type: "string", description: "노드 라벨 (15자 이내 핵심 키워드)" },
    summary: { type: "string", description: "이 개념의 한 줄 설명 (50자 이내)" },
  };
  if (depth > 0) {
    base.children = {
      type: "array",
      description: `하위 개념 (${depth === 3 ? "2~6" : "1~4"}개)`,
      items: { type: "object", properties: nodeSchema(depth - 1), required: ["label"] },
    };
  }
  return base;
}

const mindmapTool = {
  type: "function" as const,
  function: {
    name: "generate_mindmap",
    description: "강의자료의 개념 계층 구조 마인드맵을 생성합니다.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "강의 전체 핵심 주제 (15자 이내)" },
        summary: { type: "string", description: "강의 전체 한 줄 요약 (50자 이내)" },
        children: {
          type: "array",
          description: "대주제 노드 (4~8개)",
          items: {
            type: "object",
            properties: nodeSchema(3),
            required: ["label"],
          },
        },
      },
      required: ["title", "children"],
    },
  },
};

const SYSTEM_PROMPT = `당신은 강의자료를 NotebookLM 수준의 풍부한 마인드맵으로 구조화하는 전문가입니다.

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
• 2단계 진행 없이 leaf만 있는 대주제 금지`;

export async function GET(_req: Request, { params }: Params) {
  const { documentId } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("generated_contents")
    .select("content_json")
    .eq("document_id", documentId)
    .eq("content_type", "mindmap")
    .maybeSingle();
  if (error) console.error("[mindmap GET] DB error:", error.message);
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
    .select("extracted_text")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc) return new Response("Not found", { status: 404 });

  if (!force) {
    const { data: cached } = await supabase
      .from("generated_contents")
      .select("content_json")
      .eq("document_id", documentId)
      .eq("content_type", "mindmap")
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
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `다음 강의자료를 개념 중심의 계층적 마인드맵으로 구조화해줘.
페이지 순서가 아니라 개념 간 관계와 논리적 흐름이 잘 드러나도록 해줘.
대주제 4~8개, 각 대주제 아래 중간 개념 2~6개 반드시 생성해줘.
각 노드에 label과 summary를 모두 작성해줘.

강의자료:
${(doc.extracted_text ?? "").slice(0, 10000)}`,
        },
      ],
      tools: [mindmapTool],
      tool_choice: { type: "function", function: { name: "generate_mindmap" } },
      max_tokens: 4500,
      temperature: 0.3,
    });
  } catch (e) {
    return handleAiError(e);
  }

  const toolCall = completion.choices[0].message.tool_calls?.[0];
  if (!toolCall) return new Response("Function call failed", { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = JSON.parse((toolCall as any).function.arguments);

  // DB 저장 실패해도 AI 결과는 반드시 반환
  try {
    await supabase.from("generated_contents").upsert(
      { document_id: documentId, content_type: "mindmap", content_json: JSON.stringify(result) },
      { onConflict: "document_id,content_type" }
    );
  } catch (e) {
    console.error("[mindmap] DB save failed:", e);
  }

  return Response.json(result);
}
