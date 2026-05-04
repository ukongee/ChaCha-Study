import * as mupdf from "mupdf";

const SCALE = 1.5; // 108 DPI — readable quality without excessive file size

/**
 * Renders a single PDF page to a JPEG base64 string.
 * @param buffer  Raw PDF bytes (ArrayBuffer)
 * @param pageNum 1-indexed page number
 */
export async function pdfPageToJpeg(buffer: ArrayBuffer, pageNum: number): Promise<string> {
  const doc = mupdf.Document.openDocument(new Uint8Array(buffer), "application/pdf");
  const page = doc.loadPage(pageNum - 1); // mupdf is 0-indexed
  const matrix = mupdf.Matrix.scale(SCALE, SCALE);
  const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false);
  const jpegBytes = pixmap.asJPEG(80);
  return Buffer.from(jpegBytes).toString("base64");
}
