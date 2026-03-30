import { getAuthenticatedUser } from "@/lib/api/auth-helper";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser();
  if (error) return error;

  const { data, error: dbError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (dbError) return new Response("Not found", { status: 404 });
  return Response.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser();
  if (error) return error;

  // Storage 파일도 함께 삭제
  const { data: doc } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (doc?.file_path) {
    await supabase.storage.from("documents").remove([doc.file_path]);
  }

  const { error: dbError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user!.id);

  if (dbError) return new Response(dbError.message, { status: 500 });
  return new Response(null, { status: 204 });
}
