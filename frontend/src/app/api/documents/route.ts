import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, original_file_name, file_type, page_count, file_size, embedding_status, created_at")
    .order("created_at", { ascending: false });

  if (error) return new Response(error.message, { status: 500 });
  return Response.json(data);
}
