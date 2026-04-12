// DOMMatrix polyfill — pdfjs-dist v5 requires this browser global in Node.js
if (typeof globalThis.DOMMatrix === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMMatrix = class DOMMatrix {
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    is2D = true;
    isIdentity = true;

    constructor(init?: number[] | string) {
      if (Array.isArray(init) && init.length === 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        this.m11 = init[0]; this.m12 = init[1];
        this.m21 = init[2]; this.m22 = init[3];
        this.m41 = init[4]; this.m42 = init[5];
      } else if (Array.isArray(init) && init.length === 16) {
        [this.m11, this.m12, this.m13, this.m14,
         this.m21, this.m22, this.m23, this.m24,
         this.m31, this.m32, this.m33, this.m34,
         this.m41, this.m42, this.m43, this.m44] = init;
        this.a = this.m11; this.b = this.m12;
        this.c = this.m21; this.d = this.m22;
        this.e = this.m41; this.f = this.m42;
        this.is2D = this.m13 === 0 && this.m14 === 0 && this.m23 === 0 &&
          this.m24 === 0 && this.m31 === 0 && this.m32 === 0 &&
          this.m33 === 1 && this.m34 === 0 && this.m43 === 0 && this.m44 === 1;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    multiply(_other: any) { return new (globalThis as any).DOMMatrix(); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    translate(_tx: number, _ty: number, _tz = 0) { return new (globalThis as any).DOMMatrix(); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scale(_sx: number, _sy?: number, _sz?: number) { return new (globalThis as any).DOMMatrix(); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rotate(_rx: number, _ry = 0, _rz = 0) { return new (globalThis as any).DOMMatrix(); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inverse() { return new (globalThis as any).DOMMatrix(); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    flipX() { return new (globalThis as any).DOMMatrix(); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    flipY() { return new (globalThis as any).DOMMatrix(); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformPoint(point: any) { return point; }
    toFloat32Array() { return new Float32Array(16); }
    toFloat64Array() { return new Float64Array(16); }
    toString() { return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`; }
  };
}

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
