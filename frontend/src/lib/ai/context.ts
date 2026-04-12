/**
 * Shared AI utilities:
 * - NO_LATEX_RULE: 모든 LLM 출력에 적용하는 수식 규칙
 * - getSummaryContext: 요약 캐시를 컨텍스트 텍스트로 변환
 */
import { createServiceClient } from "@/lib/supabase/service";

/** 모든 LLM 시스템 프롬프트에 삽입할 수식 금지 규칙 */
export const NO_LATEX_RULE = `
[수식/공식 표현 규칙 — 반드시 준수]
- LaTeX 문법 절대 사용 금지: $$, $, \\sum, \\frac, \\cdots, ^, _ 등 일체 금지
- Markdown 수식 블록 ($$...$$, $...$) 사용 금지
- 모든 수식은 일반 텍스트로 풀어서 표현
  예) $$\\sum_{j=m}^{n} a_j$$ → "j가 m부터 n까지 변할 때 a_j를 모두 더한 값"
  예) 2^j → "2의 j제곱"
  예) x_1 → "x 서브 1"
  예) \\frac{a}{b} → "a를 b로 나눈 값"
- 수식의 의미를 한국어 문장으로 자연스럽게 설명
- 이 규칙은 요약, 설명, 퀴즈, 플래시카드, 마인드맵, 시험포인트 등 모든 출력에 적용`;

/**
 * 저장된 요약을 컨텍스트 텍스트로 변환.
 * 요약이 없으면 빈 문자열 반환.
 */
export async function getSummaryContext(
  documentId: string,
  maxChars = 8000
): Promise<string> {
  const supabase = createServiceClient();

  const { data: cached } = await supabase
    .from("generated_contents")
    .select("content_json")
    .eq("document_id", documentId)
    .eq("content_type", "summary")
    .single();

  if (!cached) return "";

  try {
    const summary = JSON.parse(cached.content_json);
    const pages: Array<{
      page: number;
      title: string;
      summary: string;
      detailedExplanation?: string;
      keyTerms?: string[];
    }> = summary.pages ?? [];

    let text = summary.briefSummary
      ? `[전체 요약]\n${summary.briefSummary}\n\n`
      : "";

    for (const page of pages) {
      const chunk = [
        `[${page.page}페이지: ${page.title}]`,
        `핵심: ${page.summary}`,
        page.detailedExplanation ? `설명: ${page.detailedExplanation}` : "",
        page.keyTerms?.length ? `키워드: ${page.keyTerms.join(", ")}` : "",
        "",
      ]
        .filter(Boolean)
        .join("\n");

      if (text.length + chunk.length > maxChars) break;
      text += chunk + "\n";
    }

    return text.length > 200 ? text : "";
  } catch {
    return "";
  }
}
