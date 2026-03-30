import { getAuthenticatedUser } from "@/lib/api/auth-helper";

export async function GET() {
  const { user, supabase, error } = await getAuthenticatedUser();
  if (error) return error;

  const { data, error: dbError } = await supabase
    .from("documents")
    .select("id, original_file_name, file_type, page_count, file_size, embedding_status, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (dbError) return new Response(dbError.message, { status: 500 });
  return Response.json(data);
}
