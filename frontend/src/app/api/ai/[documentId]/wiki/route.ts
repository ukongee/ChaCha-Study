/**
 * Wiki API — 학습용 Wiki 생성 및 섹션 단위 저장
 * GET  → 저장된 Wiki 반환 (sections 배열)
 * POST → Wiki 생성 후 섹션으로 분할하여 저장
 *
 * 생성 입력 우선순위: 저장된 요약 → extracted_text
 * 이후 AI Tutor 질문에서 섹션 단위로 선택적 사용
 */
import { createServiceClient } from "@/lib/supabase/service";
import { createAiClient, getApiKey, ApiKeyMissingError, handleAiError } from "@/lib/ai/client";
import { getSummaryContext, NO_LATEX_RULE } from "@/lib/ai/context";

const MODEL = "claude-sonnet-4-6";

export interface WikiSection {
  title: string;
  content: string;
  keywords: string[];
}

export interface WikiData {
  sections: WikiSection[];
  generatedAt: string;
}

interface Params {
  params: Promise<{ documentId: string }>;
}

const WIKI_SYSTEM = `당신은 대학교 강의자료를 학습용 Wiki로 정리하는 전문가입니다.
${NO_LATEX_RULE}

목표: 단순 요약이 아니라, 반복 학습과 질문 응답에 활용 가능한 구조화된 지식 정리

[출력 형식]
반드시 아래 섹션 구조를 사용하세요. 각 섹션은 ## 제목으로 시작합니다.

## 주제 개요
- 이 강의의 핵심 주제와 전체적인 흐름을 2~3문장으로 설명

## 핵심 개념 정리
각 개념을 아래 형식으로 작성:
### [개념명]
- 정의: (한 문장으로 명확하게)
- 특징: (2~4가지 핵심 특징)
- 예시: (실제 예 또는 적용 사례)

## 시험 포인트
- 자주 출제되는 내용을 목록으로
- 암기해야 할 핵심 내용

## 중요 규칙 / 공식
- 반드시 텍스트로 표현 (LaTeX 절대 금지)
- 공식의 의미와 사용 조건 설명

## 예시 문제
간단한 예제 문제와 풀이 (있는 경우)

## 한 줄 요약
전체 내용을 한 문장으로 정리

[작성 규칙]
- 사람이 필기한 것처럼 자연스럽고 이해 중심으로 작성
- 전문 용어는 처음 등장 시 괄호 안에 간단한 설명 추가
- 각 섹션은 독립적으로 이해 가능하도록 작성`;

export async function GET(_req: Request, { params }: Params) {
  const { documentId } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("generated_contents")
    .select("content_json")
    .eq("document_id", documentId)
    .eq("content_type", "wiki")
    .maybeSingle();

  if (error) console.error("[wiki GET] DB error:", error.message);
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
      .eq("content_type", "wiki")
      .maybeSingle();
    if (cached) {
      try { return Response.json(JSON.parse(cached.content_json)); }
      catch { /* 재생성 */ }
    }
  }

  // 입력 우선순위: 요약 캐시 → extracted_text
  let contextText = await getSummaryContext(documentId, 10000);

  if (!contextText) {
    const { data: doc } = await supabase
      .from("documents")
      .select("extracted_text, page_texts_json")
      .eq("id", documentId)
      .maybeSingle();
    if (!doc) return new Response("Not found", { status: 404 });

    const pageTexts: string[] = doc.page_texts_json ? JSON.parse(doc.page_texts_json) : [];
    if (pageTexts.length > 0) {
      contextText = pageTexts
        .filter((t) => t?.trim())
        .map((t, i) => `=== ${i + 1}페이지 ===\n${t.slice(0, 1000)}`)
        .join("\n\n")
        .slice(0, 10000);
    } else {
      contextText = (doc.extracted_text ?? "").slice(0, 10000);
    }
  }

  if (!contextText.trim()) {
    return new Response("Wiki 생성에 필요한 내용이 없습니다. 먼저 요약을 생성해주세요.", { status: 400 });
  }

  const ai = createAiClient(apiKey);
  let completion;
  try {
    completion = await ai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: WIKI_SYSTEM },
        {
          role: "user",
          content: `다음 강의자료를 기반으로 학습용 Wiki를 생성해줘.
각 섹션은 ## 제목으로 시작하고, 개념은 ### 소제목으로 구분해줘.
이 Wiki는 나중에 질문 응답의 기반 데이터로 사용됩니다.

강의자료:
${contextText}`,
        },
      ],
      max_tokens: 8000,
      temperature: 0.3,
    });
  } catch (e) {
    return handleAiError(e);
  }

  const wikiText = completion.choices[0].message.content ?? "";
  const sections = parseWikiIntoSections(wikiText);

  const wikiData: WikiData = {
    sections,
    generatedAt: new Date().toISOString(),
  };

  try {
    await supabase.from("generated_contents").upsert(
      { document_id: documentId, content_type: "wiki", content_json: JSON.stringify(wikiData) },
      { onConflict: "document_id,content_type" }
    );
  } catch (e) {
    console.error("[wiki] DB save failed:", e);
  }

  return Response.json(wikiData);
}

function parseWikiIntoSections(wikiText: string): WikiSection[] {
  const sections: WikiSection[] = [];
  const parts = wikiText.split(/\n(?=## )/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");
    const titleLine = lines[0].replace(/^##\s+/, "").trim();
    const content = lines.slice(1).join("\n").trim();
    if (!titleLine || !content) continue;
    sections.push({ title: titleLine, content, keywords: extractKeywords(titleLine + " " + content) });
  }

  if (sections.length === 0 && wikiText.trim()) {
    sections.push({ title: "전체 내용", content: wikiText.trim(), keywords: extractKeywords(wikiText) });
  }

  return sections;
}

function extractKeywords(text: string): string[] {
  const candidates = new Set<string>();
  const subheadings = text.match(/###\s+([^\n]+)/g) ?? [];
  subheadings.forEach((h) => candidates.add(h.replace(/^###\s+/, "").trim()));
  const bold = text.match(/\*\*([^*]+)\*\*/g) ?? [];
  bold.forEach((b) => candidates.add(b.replace(/\*\*/g, "").trim()));
  const words = text.match(/[가-힣]{2,8}/g) ?? [];
  const freq: Record<string, number> = {};
  words.forEach((w) => { freq[w] = (freq[w] ?? 0) + 1; });
  Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([w]) => candidates.add(w));
  return Array.from(candidates).slice(0, 15);
}
