import { createServiceClient } from "@/lib/supabase/service";
import { resolveUserContext } from "@/lib/resolveUser";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return new Response("Not found", { status: 404 });
  return Response.json(data);
}

export async function DELETE(req: Request, { params }: Params) {
  const { userId, keyHash } = await resolveUserContext(req);

  if (!userId && !keyHash) {
    return new Response("API 키가 필요합니다.", { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("file_path, user_id, api_key_hash")
    .eq("id", id)
    .single();

  if (!doc) return new Response("Not found", { status: 404 });

  // Ownership: user_id (primary) or api_key_hash (legacy fallback)
  const isOwner = doc.user_id
    ? doc.user_id === userId
    : keyHash !== null && keyHash === doc.api_key_hash;

  if (!isOwner) return new Response("Forbidden", { status: 403 });

  if (doc.file_path) {
    await supabase.storage.from("documents").remove([doc.file_path]);
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return new Response(error.message, { status: 500 });
  return new Response(null, { status: 204 });
}
