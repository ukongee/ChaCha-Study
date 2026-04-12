/**
 * Summary API — 10페이지 단위 누적 생성
 * GET  → 저장된 결과 반환
 * POST → 다음 구간(10페이지) 생성 후 누적 저장
 *        force=true 이면 전체 초기화 후 1페이지부터 재생성
 */
import { createServiceClient } from "@/lib/supabase/service";
import { createAiClient, getApiKey, ApiKeyMissingError, handleAiError } from "@/lib/ai/client";

const MODEL = "claude-sonnet-4-6";
const CHUNK_SIZE = 10;
const PAGE_CHAR_LIMIT = 2000;

const SUMMARY_SYSTEM = `당신은 대학교 강의자료를 페이지별로 해설해주는 학습 도우미입니다.

학생이 PDF를 화면 왼쪽에 띄워두고, 오른쪽에서 각 페이지의 내용을 이해하는 용도입니다.

[briefSummary — 최초 생성 시에만 포함]
- 문서 전체 흐름과 핵심 주제를 2~3문장으로 요약

[pages 배열]
page: 페이지 번호 (정수)
title: 해당 페이지 핵심 주제 (10자 이내, 명사형)
summary: 핵심 내용 1~2문장 (전체 요약)
detailedExplanation: 마크다운 형식으로 구조화된 해설
  - ### 소제목 으로 섹션 구분 (예: ### 정의, ### 핵심 특징, ### 동작 과정)
  - 목록은 "- 항목" 형식으로 작성
  - 단계별 설명은 "1. 단계" 형식으로 작성
  - 강조할 용어는 **굵게** 표시
  - 섹션은 내용에 따라 자유롭게 구성 (정의 / 특징 / 구조 / 동작원리 / 조건 등)
  - 페이지의 모든 핵심 내용 포함, 번역투 금지, 자연스러운 한국어
  - 최소 200자 이상
keyTerms: 핵심 용어 3~7개

[금지]
- "이 페이지는 ~에 대해 설명합니다" 같은 메타 문장 금지
- 시험 출제 가능성, 중요도 표시 금지

반드시 아래 JSON 형식으로만 응답하세요.

첫 번째 구간(briefSummary 포함):
{
  "briefSummary": "문서 전체 흐름 요약",
  "pages": [
    {
      "page": 1,
      "title": "페이지 핵심 주제",
      "summary": "핵심 내용 1~2문장",
      "detailedExplanation": "### 정의\\n**용어**는 ~입니다.\\n\\n### 핵심 특징\\n- 특징 1\\n- 특징 2",
      "keyTerms": ["용어1", "용어2"]
    }
  ]
}

이후 구간(briefSummary 생략):
{
  "pages": [...]
}`;

interface Params {
  params: Promise<{ documentId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { documentId } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("generated_contents")
    .select("content_json")
    .eq("document_id", documentId)
    .eq("content_type", "summary")
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

  // 문서 로드
  const { data: doc } = await supabase
    .from("documents")
    .select("extracted_text, page_texts_json, page_count")
    .eq("id", documentId)
    .single();
  if (!doc) return new Response("Not found", { status: 404 });

  const totalPages: number = doc.page_count ?? 1;
  const pageTexts: string[] = doc.page_texts_json ? JSON.parse(doc.page_texts_json) : [];

  // 기존 저장 데이터 로드
  const { data: cached } = await supabase
    .from("generated_contents")
    .select("content_json")
    .eq("document_id", documentId)
    .eq("content_type", "summary")
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let existing: any = null;
  if (cached && !force) {
    try { existing = JSON.parse(cached.content_json); } catch { /* 재생성 */ }
  }

  // 이미 생성된 페이지 목록
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingPages: any[] = existing?.pages ?? [];
  const maxGeneratedPage = existingPages.length > 0
    ? Math.max(...existingPages.map((p: { page: number }) => p.page))
    : 0;

  // 다음 구간 계산
  const startPage = force ? 1 : maxGeneratedPage + 1;
  const endPage = Math.min(startPage + CHUNK_SIZE - 1, totalPages);

  // 이미 전체 생성 완료
  if (!force && startPage > totalPages) {
    return Response.json({ ...(existing ?? {}), complete: true, totalPages });
  }

  // 해당 구간 텍스트 추출
  let contextText: string;
  if (pageTexts.length > 0) {
    contextText = pageTexts
      .slice(startPage - 1, endPage)
      .filter((t) => t?.trim())
      .map((t, i) => `=== ${startPage + i}페이지 ===\n${t.slice(0, PAGE_CHAR_LIMIT)}`)
      .join("\n\n");
  } else {
    // page_texts_json 없으면 extracted_text 균등 분할
    const fullText = doc.extracted_text ?? "";
    const chunkSize = Math.ceil(fullText.length / Math.max(totalPages, 1));
    const sliceStart = (startPage - 1) * chunkSize;
    const sliceEnd = endPage * chunkSize;
    contextText = fullText.slice(sliceStart, sliceEnd).slice(0, PAGE_CHAR_LIMIT * CHUNK_SIZE);
  }

  if (!contextText.trim()) {
    return new Response("해당 구간의 텍스트가 없습니다.", { status: 400 });
  }

  const isFirstChunk = startPage === 1;

  const ai = createAiClient(apiKey);
  let completion;
  try {
    completion = await ai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SUMMARY_SYSTEM },
        {
          role: "user",
          content: isFirstChunk
            ? `다음 강의자료의 ${startPage}~${endPage}페이지를 해설해줘. 이 구간이 문서의 첫 번째 구간이므로 briefSummary도 포함해줘.
각 페이지 내용을 빠짐없이 한국어로 구조화해서 설명해줘.\n\n${contextText}`
            : `다음 강의자료의 ${startPage}~${endPage}페이지를 해설해줘. briefSummary는 생략하고 pages 배열만 반환해줘.
각 페이지 내용을 빠짐없이 한국어로 구조화해서 설명해줘.\n\n${contextText}`,
        },
      ],
      max_tokens: 8192,
      temperature: 0.2,
    });
  } catch (e) {
    return handleAiError(e);
  }

  const raw = completion.choices[0].message.content ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const chunkJson = jsonMatch ? jsonMatch[0] : raw;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chunkData: any;
  try {
    chunkData = JSON.parse(chunkJson);
  } catch {
    console.error("[summary] JSON parse failed, raw length:", raw.length);
    return new Response("AI 응답 처리에 실패했습니다. 다시 시도해주세요.", { status: 500 });
  }

  // 기존 pages와 병합
  const newPages: unknown[] = chunkData.pages ?? [];
  const mergedPages = force
    ? newPages
    : [...existingPages, ...newPages];

  const merged = {
    briefSummary: isFirstChunk ? (chunkData.briefSummary ?? "") : (existing?.briefSummary ?? ""),
    pages: mergedPages,
    totalPages,
    complete: endPage >= totalPages,
  };

  const mergedJson = JSON.stringify(merged);

  const { error } = await supabase.from("generated_contents").upsert(
    { document_id: documentId, content_type: "summary", content_json: mergedJson },
    { onConflict: "document_id,content_type" }
  );
  if (error) console.error("[summary] upsert error:", error.message);

  return Response.json(merged);
}
