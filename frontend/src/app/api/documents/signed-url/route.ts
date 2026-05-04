import { createServiceClient } from "@/lib/supabase/service";
import { resolveUser } from "@/lib/resolveUser";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function getFileType(filename: string, mime: string): "PDF" | "PPT" | "PPTX" | null {
  const ext = filename.split(".").pop()?.toUpperCase();
  if (ext === "PDF" || mime === "application/pdf") return "PDF";
  if (ext === "PPTX" || mime.includes("presentationml")) return "PPTX";
  if (ext === "PPT" || mime.includes("ms-powerpoint")) return "PPT";
  return null;
}

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-ai-api-key");
  if (!apiKey) return new Response("API 키가 필요합니다.", { status: 401 });

  const ctx = await resolveUser(req);
  if (!ctx) return new Response("먼저 설정에서 API 키를 저장해주세요.", { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.filename || !body?.fileType || typeof body?.fileSize !== "number") {
    return new Response("filename, fileType, fileSize가 필요합니다.", { status: 400 });
  }

  const { filename, fileType: mime, fileSize } = body;
  if (fileSize > MAX_FILE_SIZE) return new Response("파일 크기는 50MB 이하여야 합니다.", { status: 400 });

  const fileType = getFileType(filename, mime);
  if (!fileType) return new Response("PDF, PPT, PPTX 파일만 업로드 가능합니다.", { status: 400 });

  const docId = crypto.randomUUID();
  const ext = filename.split(".").pop() ?? "bin";
  const storagePath = `${docId}/original.${ext}`;

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    console.error("Signed URL error:", error);
    return new Response("업로드 URL 생성에 실패했습니다.", { status: 500 });
  }

  return Response.json({
    signedUrl: data.signedUrl,
    path: storagePath,
    documentId: docId,
    fileType,
  });
}
