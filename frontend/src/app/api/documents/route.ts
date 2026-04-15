import { createServiceClient } from "@/lib/supabase/service";
import { resolveUser, resolveKeyHash } from "@/lib/resolveUser";

export async function GET(req: Request) {
  const supabase = createServiceClient();
  const SELECT = "id, original_file_name, file_type, page_count, file_size, embedding_status, created_at";

  // Primary: resolve user_id server-side from api_key
  const ctx = await resolveUser(req);
  if (ctx) {
    const { data, error } = await supabase
      .from("documents")
      .select(SELECT)
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false });

    if (error) return new Response(error.message, { status: 500 });
    return Response.json(data);
  }

  // Fallback: legacy api_key_hash (pre-migration clients)
  const keyHash = resolveKeyHash(req);
  if (keyHash) {
    const { data, error } = await supabase
      .from("documents")
      .select(SELECT)
      .eq("api_key_hash", keyHash)
      .order("created_at", { ascending: false });

    if (error) return new Response(error.message, { status: 500 });
    return Response.json(data);
  }

  return new Response("API 키가 필요합니다.", { status: 401 });
}
