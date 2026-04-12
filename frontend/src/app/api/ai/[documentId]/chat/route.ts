/**
 * AI Tutor Chat — Wiki 기반 질문 응답
 *
 * 기존 RAG(벡터 검색) 방식 → Wiki 섹션 선택 방식으로 변경
 *
 * 흐름:
 * 1. 저장된 Wiki sections 로드
 * 2. 질문과 관련된 섹션 선택 (키워드 스코어링)
 * 3. 선택된 섹션 기반으로 LLM 답변 생성
 * 4. 대화 기록 저장
 */
import { createServiceClient } from "@/lib/supabase/service";
import { createAiClient, getApiKey, ApiKeyMissingError, handleAiError } from "@/lib/ai/client";
import { NO_LATEX_RULE } from "@/lib/ai/context";
import type { WikiSection, WikiData } from "@/app/api/ai/[documentId]/wiki/route";

const MODEL = "claude-sonnet-4-6";
/** 질문당 선택할 최대 섹션 수 */
const MAX_SECTIONS = 4;

interface Params {
  params: Promise<{ documentId: string }>;
}

// ── 섹션 관련성 스코어링 ─────────────────────────────────────────────────────

/**
 * 질문과 각 섹션의 관련도를 키워드 오버랩으로 계산하여 상위 섹션 반환.
 * 모든 점수가 0이면 앞 섹션 MAX_SECTIONS개 반환 (fallback).
 */
function selectRelevantSections(
  sections: WikiSection[],
  question: string,
  topK = MAX_SECTIONS
): WikiSection[] {
  const questionTokens = tokenize(question);

  const scored = sections.map((section) => {
    const titleTokens = tokenize(section.title);
    const contentTokens = tokenize(section.content);
    const keywordTokens = section.keywords.flatMap(tokenize);

    let score = 0;
    for (const qt of questionTokens) {
      if (titleTokens.some((t) => t.includes(qt) || qt.includes(t))) score += 3;
      if (keywordTokens.some((t) => t.includes(qt) || qt.includes(t))) score += 2;
      if (contentTokens.some((t) => t.includes(qt) || qt.includes(t))) score += 1;
    }
    return { section, score };
  });

  const relevant = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.section);

  // fallback: 관련 섹션이 없으면 앞 섹션들 반환
  return relevant.length > 0 ? relevant : sections.slice(0, topK);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^가-힣a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

// ── API handlers ─────────────────────────────────────────────────────────────

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
  const body = await req.json();
  const question: string = body.question;

  if (!question?.trim()) return new Response("질문이 비어있습니다.", { status: 400 });

  // Wiki 로드
  const { data: wikiCache } = await supabase
    .from("generated_contents")
    .select("content_json")
    .eq("document_id", documentId)
    .eq("content_type", "wiki")
    .single();

  if (!wikiCache) {
    return new Response(
      JSON.stringify({
        role: "assistant",
        content: "아직 Wiki가 생성되지 않았습니다. AI Tutor 탭에서 'Wiki 생성하기' 버튼을 눌러 먼저 Wiki를 생성해주세요.",
        sources: [],
        needsWiki: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  let wikiData: WikiData;
  try {
    wikiData = JSON.parse(wikiCache.content_json);
  } catch {
    return new Response("Wiki 데이터를 불러올 수 없습니다.", { status: 500 });
  }

  const { sections } = wikiData;
  if (!sections || sections.length === 0) {
    return new Response("Wiki 섹션이 비어있습니다. Wiki를 재생성해주세요.", { status: 400 });
  }

  // 관련 섹션 선택
  const relevantSections = selectRelevantSections(sections, question);

  const contextText = relevantSections
    .map((s) => `## ${s.title}\n${s.content}`)
    .join("\n\n---\n\n");

  const sectionTitles = relevantSections.map((s) => s.title);

  // 최근 대화 기록 (최대 8개)
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(8);

  const recentHistory = (history ?? []).reverse();

  const ai = createAiClient(apiKey);
  let completion;
  try {
    completion = await ai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `당신은 강의자료 기반 학습 도우미입니다.
${NO_LATEX_RULE}

[답변 규칙]
1. 반드시 아래 [Wiki 내용]을 기반으로 답변하세요
2. Wiki에 없는 내용은 "해당 내용은 Wiki에서 확인되지 않습니다"라고 답하고, 필요 시 일반 지식으로 보충하세요
3. 시험 대비 관점으로 핵심을 먼저 설명하고, 필요시 구체적인 내용을 보충하세요
4. 학생이 이해하기 쉽도록 친절하게 설명하세요
5. 참고한 섹션을 답변 끝에 "📖 참고 섹션: [섹션명]" 형식으로 표시하세요

[Wiki 내용]
${contextText}`,
        },
        ...recentHistory.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: question },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    });
  } catch (e) {
    return handleAiError(e);
  }

  const answer = completion.choices[0].message.content ?? "";

  const sources = sectionTitles.map((title) => ({
    page: null,
    sectionTitle: title,
    excerpt: (relevantSections.find((s) => s.title === title)?.content.slice(0, 120) ?? "") + "...",
  }));

  // 대화 기록 저장
  await supabase.from("chat_messages").insert([
    { document_id: documentId, role: "user", content: question },
    {
      document_id: documentId,
      role: "assistant",
      content: answer,
      sources: sources.length > 0 ? sources : null,
    },
  ]);

  return Response.json({ role: "assistant", content: answer, sources });
}

export async function GET(_req: Request, { params }: Params) {
  const { documentId } = await params;
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("chat_messages")
    .select("id, role, content, sources, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  return Response.json(data ?? []);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { documentId } = await params;
  const supabase = createServiceClient();

  await supabase.from("chat_messages").delete().eq("document_id", documentId);
  return new Response(null, { status: 204 });
}
