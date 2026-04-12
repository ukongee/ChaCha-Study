/**
 * Mindmap generation — rich concept-hierarchy tree.
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

const SYSTEM_PROMPT = `당신은 강의자료를 풍부한 마인드맵으로 구조화하는 전문가입니다.
${NO_LATEX_RULE}

[마인드맵 생성 원칙]
1. 페이지 순서가 아니라 개념 중심으로 묶기 — 비슷한 개념은 한 그룹으로
2. 계층 구조:
   - root: 강의 전체 핵심 주제 (1개)
   - 1단계(대주제): 강의의 주요 개념 축 (4~8개)
   - 2단계(중간 개념): 각 대주제의 세부 개념 (2~6개)
   - 3단계(세부 항목): 필요한 경우만 (1~4개)
3. 각 노드에 label(10자 이내)과 summary(30자 이내 한 줄 설명) 작성
4. 단순 페이지 제목 나열 금지 — 개념 중심으로 재구성

반드시 아래 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

{
  "title": "강의 핵심 주제",
  "summary": "강의 전체 한 줄 요약",
  "children": [
    {
      "label": "대주제1",
      "summary": "한 줄 설명",
      "children": [
        {
          "label": "중간개념",
          "summary": "한 줄 설명",
          "children": [
            { "label": "세부항목", "summary": "한 줄 설명" }
          ]
        }
      ]
    }
  ]
}`;

const mindmapTool = {
  type: "function" as const,
  function: {
    name: "generate_mindmap",
    description: "강의자료를 계층적 마인드맵 구조로 생성합니다.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "강의 핵심 주제" },
        summary: { type: "string", description: "강의 전체 한 줄 요약" },
        children: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              summary: { type: "string" },
              children: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    summary: { type: "string" },
                    children: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          label: { type: "string" },
                          summary: { type: "string" },
                        },
                        required: ["label", "summary"],
                      },
                    },
                  },
                  required: ["label", "summary"],
                },
              },
            },
            required: ["label", "summary"],
          },
        },
      },
      required: ["title", "summary", "children"],
    },
  },
};

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
  let contextText = await getSummaryContext(documentId, 7000);

  if (!contextText) {
    const { data: doc } = await supabase
      .from("documents")
      .select("extracted_text")
      .eq("id", documentId)
      .single();

    if (!doc) return new Response("Not found", { status: 404 });
    contextText = (doc.extracted_text ?? "").slice(0, 7000);
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
페이지 순서가 아니라 개념 간 관계와 논리적 흐름이 잘 드러나도록 해줘.
각 노드에 label과 summary를 모두 작성해줘.

강의자료:
${contextText}`,
        },
      ],
      tools: [mindmapTool],
      tool_choice: { type: "function", function: { name: "generate_mindmap" } },
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

  await supabase.from("generated_contents").upsert(
    { document_id: documentId, content_type: "mindmap", content_json: JSON.stringify(result) },
    { onConflict: "document_id,content_type" }
  );

  return Response.json(result);
}
