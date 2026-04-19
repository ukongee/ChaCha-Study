import { PDFParse } from "pdf-parse";

export interface ParseResult {
  fullText: string;
  pageTexts: string[];
  pageCount: number;
}

export async function parsePdf(buffer: ArrayBuffer): Promise<ParseResult> {
  const parser = new PDFParse({ data: Buffer.from(buffer) });

  try {
    const result = await parser.getText();

    // result.pages: [{ num, text }] sorted by page number
    const pageTexts = result.pages.map((p: { text: string }) => p.text.trim());
    const fullText = pageTexts.join("\n\n") || result.text;

    return {
      fullText,
      pageTexts,
      pageCount: result.total,
    };
  } finally {
    await parser.destroy();
  }
}
