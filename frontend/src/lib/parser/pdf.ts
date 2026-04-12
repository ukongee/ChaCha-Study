export interface ParseResult {
  fullText: string;
  pageTexts: string[];
  pageCount: number;
}

export async function parsePdf(buffer: ArrayBuffer): Promise<ParseResult> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Disable worker — runs in main thread (required for Vercel serverless)
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items as Array<{ str: string }>)
      .map((item) => item.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pageTexts.push(text);
  }

  await pdf.destroy();

  return {
    fullText: pageTexts.join("\n\n"),
    pageTexts,
    pageCount,
  };
}
