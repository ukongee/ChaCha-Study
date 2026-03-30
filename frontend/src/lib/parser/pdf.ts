/**
 * PDF 파싱 - pdf-parse 사용
 * 페이지별 텍스트 추출
 */

export interface ParseResult {
  fullText: string;
  pageTexts: string[];
  pageCount: number;
}

export async function parsePdf(buffer: ArrayBuffer): Promise<ParseResult> {
  // pdf-parse는 Node.js 전용 — dynamic import로 Edge 런타임 충돌 방지
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse = (await import("pdf-parse")) as any as (
    buffer: Buffer,
    options?: Record<string, unknown>
  ) => Promise<{ numpages: number; text: string }>;

  const pageTexts: string[] = [];

  const data = await pdfParse(Buffer.from(buffer), {
    pagerender(pageData: { getTextContent: () => Promise<{ items: Array<{ str: string; hasEOL?: boolean; transform?: number[] }> }> }) {
      return pageData.getTextContent().then(
        (textContent: { items: Array<{ str: string; hasEOL?: boolean; transform?: number[] }> }) => {
          let text = "";
          let lastY: number | null = null;

          for (const item of textContent.items) {
            const y = item.transform?.[5] ?? null;

            if (lastY !== null && y !== null && Math.abs(y - lastY) > 5) {
              text += "\n";
            }
            text += item.str + (item.hasEOL ? "\n" : " ");
            lastY = y;
          }

          pageTexts.push(text.trim());
          return text;
        }
      );
    },
  });

  return {
    fullText: pageTexts.join("\n\n"),
    pageTexts,
    pageCount: data.numpages,
  };
}
