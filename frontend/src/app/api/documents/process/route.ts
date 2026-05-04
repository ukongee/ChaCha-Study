import { createServiceClient } from "@/lib/supabase/service";
import { resolveUser } from "@/lib/resolveUser";
import { parsePdf } from "@/lib/parser/pdf";
import { parsePptx, parsePpt } from "@/lib/parser/pptx";

export const maxDuration = 300;

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-ai-api-key");
  if (!apiKey) return new Response("API 키가 필요합니다.", { status: 401 });

  const ctx = await resolveUser(req);
  if (!ctx) return new Response("먼저 설정에서 API 키를 저장해주세요.", { status: 401 });

  const body = await req.json().catch(() => null);
  if (
    !body?.path ||
    !body?.documentId ||
    !body?.filename ||
    !body?.fileType ||
    typeof body?.fileSize !== "number"
  ) {
    return new Response("필수 파라미터가 누락되었습니다.", { status: 400 });
  }

  const { path: storagePath, documentId, filename, fileType, fileSize } = body;
  const supabase = createServiceClient();

  const { data: fileBlob, error: dlError } = await supabase.storage
    .from("documents")
    .download(storagePath);

  if (dlError || !fileBlob) {
    console.error("Download error:", dlError);
    return new Response("업로드된 파일을 처리할 수 없습니다.", { status: 500 });
  }

  const buffer = await fileBlob.arrayBuffer();

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
    await supabase.storage.from("documents").remove([storagePath]);
    return new Response("파일 파싱에 실패했습니다.", { status: 422 });
  }

  const { data: doc, error: dbError } = await supabase
    .from("documents")
    .insert({
      id: documentId,
      original_file_name: filename,
      file_path: storagePath,
      file_type: fileType,
      extracted_text: parseResult.fullText,
      page_texts_json: JSON.stringify(parseResult.pageTexts),
      page_count: parseResult.pageCount,
      file_size: fileSize,
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
