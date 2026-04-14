import { createServiceClient } from "@/lib/supabase/service";
import { resolveUserContext } from "@/lib/resolveUser";

export async function GET(req: Request) {
  const { userId, keyHash } = await resolveUserContext(req);

  // Must have at least the api_key to identify who's asking
  if (!userId && !keyHash) {
    return new Response("API 키가 필요합니다.", { status: 401 });
  }

  const supabase = createServiceClient();
  const SELECT = "id, original_file_name, file_type, page_count, file_size, embedding_status, created_at";

  if (userId) {
    // Primary: resolved user_id (post-migration, secure)
    const { data, error } = await supabase
      .from("documents")
      .select(SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return new Response(error.message, { status: 500 });
    return Response.json(data);
  }

  // Fallback: api_key_hash for legacy documents (before 006 migration)
  const { data, error } = await supabase
    .from("documents")
    .select(SELECT)
    .eq("api_key_hash", keyHash)
    .order("created_at", { ascending: false });

  if (error) return new Response(error.message, { status: 500 });
  return Response.json(data);
}
