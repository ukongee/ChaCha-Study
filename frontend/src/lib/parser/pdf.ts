import { extractText, getDocumentProxy } from "unpdf";

export interface ParseResult {
  fullText: string;
  pageTexts: string[];
  pageCount: number;
}

export async function parsePdf(buffer: ArrayBuffer): Promise<ParseResult> {
  const doc = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text: pageTexts } = await extractText(doc, { mergePages: false });

  const fullText = (pageTexts as string[]).join("\n\n");

  return {
    fullText,
    pageTexts: pageTexts as string[],
    pageCount: totalPages,
  };
}
