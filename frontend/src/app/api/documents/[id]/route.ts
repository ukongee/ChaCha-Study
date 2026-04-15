import { createServiceClient } from "@/lib/supabase/service";
import { resolveUser, resolveKeyHash } from "@/lib/resolveUser";

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
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("file_path, user_id, api_key_hash")
    .eq("id", id)
    .single();

  if (!doc) return new Response("Not found", { status: 404 });

  // Ownership check: user_id (new) or api_key_hash (legacy fallback)
  let isOwner = false;
  if (doc.user_id) {
    const ctx = await resolveUser(req);
    isOwner = ctx?.userId === doc.user_id;
  } else if (doc.api_key_hash) {
    const keyHash = resolveKeyHash(req);
    isOwner = keyHash === doc.api_key_hash;
  }

  if (!isOwner) return new Response("Forbidden", { status: 403 });

  if (doc.file_path) {
    await supabase.storage.from("documents").remove([doc.file_path]);
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return new Response(error.message, { status: 500 });
  return new Response(null, { status: 204 });
}
