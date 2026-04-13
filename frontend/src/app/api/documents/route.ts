import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function GET(req: Request) {
  const apiKey = req.headers.get("x-ai-api-key");
  if (!apiKey) return new Response("API 키가 필요합니다.", { status: 401 });

  const supabase = createServiceClient();
  const keyHash = hashApiKey(apiKey);

  const { data, error } = await supabase
    .from("documents")
    .select("id, original_file_name, file_type, page_count, file_size, embedding_status, created_at")
    .eq("api_key_hash", keyHash)
    .order("created_at", { ascending: false });

  if (error) return new Response(error.message, { status: 500 });
  return Response.json(data);
}
