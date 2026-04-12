import { createServiceClient } from "@/lib/supabase/service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("notes")
    .select("content, updated_at")
    .eq("document_id", id)
    .single();

  return Response.json({ content: data?.content ?? "", updated_at: data?.updated_at ?? null });
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createServiceClient();

  const body = await req.json().catch(() => ({}));
  const content: string = body.content ?? "";

  const { error } = await supabase
    .from("notes")
    .upsert(
      { document_id: id, content, updated_at: new Date().toISOString() },
      { onConflict: "document_id" }
    );

  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ ok: true });
}
