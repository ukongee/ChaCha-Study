/**
 * 구조 기반 청킹
 * - 제목/소제목 경계에서 분할
 * - 청크에 섹션 제목 포함 (검색 품질 향상)
 * - 400~800 토큰 기준, 50~120 토큰 오버랩
 */

export interface Chunk {
  content: string;       // 섹션제목 + 본문 (LLM/임베딩에 전달)
  chunkIndex: number;
  pageNumber: number;
  sectionTitle: string;
}

// 대략적인 토큰 수 추정 (1 토큰 ≈ 3~4 한글자 or 4 영문자)
function estimateTokens(text: string): number {
  const korean = (text.match(/[가-힣]/g) || []).length;
  const others = text.length - korean;
  return Math.ceil(korean / 3 + others / 4);
}

// 섹션 제목 패턴 감지
function isSectionTitle(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // 패턴: "1.", "1장", "Chapter", "###", "제목:" 등
  const patterns = [
    /^\d+[\.\)]\s+\S/,           // "1. 제목", "1) 제목"
    /^[IVXLC]+\.\s+\S/i,         // "I. 제목"
    /^#{1,3}\s+\S/,              // "# 제목", "## 제목"
    /^(Chapter|Section|Part)\s+/i,
    /^제\s*\d+\s*(장|절|부)/,    // "제1장", "제1절"
    /^[가-힣]{1,10}\s*:$/,       // "개요:", "정의:"
  ];

  const isShort = trimmed.length < 60;
  const matchesPattern = patterns.some((p) => p.test(trimmed));
  const isAllUpper = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);

  return isShort && (matchesPattern || isAllUpper);
}

interface PageText {
  page: number;
  text: string;
}

export function chunkDocument(pageTexts: PageText[]): Chunk[] {
  const chunks: Chunk[] = [];
  const CHUNK_MAX_TOKENS = 700;
  const OVERLAP_TOKENS = 80;

  let currentSection = "도입";
  let buffer = "";
  let bufferPage = 1;
  let chunkIndex = 0;

  function flushBuffer(overlapText: string = "") {
    const content = buffer.trim();
    if (estimateTokens(content) < 30) return; // 너무 짧은 청크 제외

    chunks.push({
      content: `[${currentSection}]\n${content}`,
      chunkIndex: chunkIndex++,
      pageNumber: bufferPage,
      sectionTitle: currentSection,
    });

    // 오버랩: 다음 청크에 현재 청크 끝 부분 포함
    if (overlapText) {
      buffer = overlapText;
    } else {
      // 버퍼 끝 OVERLAP_TOKENS 분량 유지
      const words = content.split(/\s+/);
      const overlapWords = Math.ceil(OVERLAP_TOKENS / 2);
      buffer = words.slice(-overlapWords).join(" ") + "\n";
    }
  }

  for (const { page, text } of pageTexts) {
    const lines = text.split("\n");

    for (const line of lines) {
      if (isSectionTitle(line)) {
        // 섹션 경계: 현재 버퍼 flush 후 섹션 갱신
        if (estimateTokens(buffer) > 50) {
          flushBuffer();
        }
        currentSection = line.trim();
        bufferPage = page;
        buffer = "";
        continue;
      }

      buffer += line + "\n";

      // 버퍼가 최대 토큰 초과 시 flush
      if (estimateTokens(buffer) >= CHUNK_MAX_TOKENS) {
        flushBuffer();
        bufferPage = page;
      }
    }
  }

  // 남은 버퍼 flush
  if (buffer.trim()) {
    flushBuffer();
  }

  return chunks;
}
