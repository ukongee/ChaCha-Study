/**
 * PPTX 파싱 - jszip으로 슬라이드별 텍스트 추출
 * PPTX = ZIP 파일, 각 슬라이드는 ppt/slides/slide{N}.xml
 */

import JSZip from "jszip";
import type { ParseResult } from "./pdf";

function extractTextFromXml(xml: string): string {
  // <a:t>텍스트</a:t> 패턴에서 텍스트 추출
  const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? [];
  return matches
    .map((m) => m.replace(/<a:t[^>]*>/, "").replace(/<\/a:t>/, "").trim())
    .filter(Boolean)
    .join(" ");
}

function extractParagraphsFromXml(xml: string): string {
  // <a:p> 단락 단위로 줄바꿈 보존
  const paragraphs = xml.match(/<a:p[\s\S]*?<\/a:p>/g) ?? [];
  return paragraphs
    .map(extractTextFromXml)
    .filter(Boolean)
    .join("\n");
}

export async function parsePptx(buffer: ArrayBuffer): Promise<ParseResult> {
  const zip = await JSZip.loadAsync(buffer);

  // 슬라이드 파일 목록 (순서대로 정렬)
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] ?? "0");
      const numB = parseInt(b.match(/\d+/)?.[0] ?? "0");
      return numA - numB;
    });

  const pageTexts: string[] = [];

  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async("string");
    const text = extractParagraphsFromXml(xml);
    pageTexts.push(text);
  }

  return {
    fullText: pageTexts.join("\n\n--- 슬라이드 구분 ---\n\n"),
    pageTexts,
    pageCount: pageTexts.length,
  };
}

/** 구형 .ppt (binary) - 텍스트만 추출, 슬라이드 구분 없음 */
export async function parsePpt(buffer: ArrayBuffer): Promise<ParseResult> {
  // Binary PPT는 JS에서 완전한 파싱이 어려움
  // ASCII 텍스트 범위만 추출 (기본적인 동작 보장)
  const bytes = new Uint8Array(buffer);
  let text = "";
  let chunk = "";

  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if ((c >= 32 && c <= 126) || c === 10 || c === 13) {
      chunk += String.fromCharCode(c);
    } else {
      if (chunk.trim().length > 3) text += chunk;
      chunk = "";
    }
  }

  const cleaned = text
    .replace(/[^\x20-\x7E\n가-힣]/g, " ")
    .replace(/\s{3,}/g, "\n")
    .trim();

  return {
    fullText: cleaned,
    pageTexts: [cleaned],
    pageCount: 1,
  };
}
