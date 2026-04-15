/**
 * File upload pipeline:
 * 1. Parse PDF/PPTX text
 * 2. Save to Supabase Storage
 * 3. Insert document record (user_id resolved server-side from api_key)
 */
import { createServiceClient } from "@/lib/supabase/service";
import { resolveUser } from "@/lib/resolveUser";
import { parsePdf } from "@/lib/parser/pdf";
import { parsePptx, parsePpt } from "@/lib/parser/pptx";

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

  // Server resolves user_id — client cannot spoof this
  const ctx = await resolveUser(req);
  if (!ctx) {
    return new Response("먼저 설정에서 API 키를 저장해주세요.", { status: 401 });
  }

  const supabase = createServiceClient();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return new Response("Invalid form data", { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return new Response("파일이 없습니다.", { status: 400 });
  if (file.size > MAX_FILE_SIZE) return new Response("파일 크기는 50MB 이하여야 합니다.", { status: 400 });

  const fileType = getFileType(file.name, file.type);
  if (!fileType) return new Response("PDF, PPT, PPTX 파일만 업로드 가능합니다.", { status: 400 });

  const rawBuffer = await file.arrayBuffer();
  const buffer = rawBuffer.slice(0);
  const uploadBuffer = rawBuffer.slice(0);

  let parseResult: { fullText: string; pageTexts: string[]; pageCount: number };
  try {
    if (fileType === "PDF") {
      parseResult = await parsePdf(buffer);
    } else if (fileType === "PPTX") {
      parseResult = await parsePptx(buffer);
    } else {
      parseResult = await parsePpt(buffer);
    }
  } catch (e) {
    console.error("Parse error:", e);
    return new Response("파일 파싱에 실패했습니다.", { status: 422 });
  }

  const tempId = crypto.randomUUID();
  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${tempId}/original.${ext}`;

  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(storagePath, uploadBuffer, { contentType: file.type, upsert: false });

  if (storageError) {
    console.error("Storage error:", storageError);
    return new Response("파일 저장에 실패했습니다.", { status: 500 });
  }

  const { data: doc, error: dbError } = await supabase
    .from("documents")
    .insert({
      id: tempId,
      original_file_name: file.name,
      file_path: storagePath,
      file_type: fileType,
      extracted_text: parseResult.fullText,
      page_texts_json: JSON.stringify(parseResult.pageTexts),
      page_count: parseResult.pageCount,
      file_size: file.size,
      embedding_status: "pending",
      user_id: ctx.userId,
    })
    .select("id, original_file_name, file_type, page_count, file_size, embedding_status, created_at")
    .single();

  if (dbError || !doc) {
    await supabase.storage.from("documents").remove([storagePath]);
    console.error("DB error:", dbError);
    return new Response("문서 저장에 실패했습니다.", { status: 500 });
  }

  return Response.json(doc, { status: 201 });
}
