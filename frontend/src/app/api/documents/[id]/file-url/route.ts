import { createServiceClient } from "@/lib/supabase/service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .single();

  if (!doc?.file_path) return new Response("Not found", { status: 404 });

  const { data } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 3600); // 1 hour

  if (!data?.signedUrl) return new Response("Failed to generate URL", { status: 500 });

  return Response.json({ url: data.signedUrl });
}
