/**
 * Quiz Set Detail — 특정 퀴즈 세트 조회
 * GET /api/ai/quiz-sets/[setId]
 */
import { createServiceClient } from "@/lib/supabase/service";

interface Params { params: Promise<{ setId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { setId } = await params;
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("quiz_sets")
    .select("id, title, config_json, content_json, created_at")
    .eq("id", setId)
    .single();

  if (!data) return new Response("Not found", { status: 404 });

  let quizzes;
  try { quizzes = JSON.parse(data.content_json as string).quizzes; }
  catch { quizzes = []; }

  return Response.json({
    id: data.id,
    title: data.title,
    configJson: data.config_json,
    quizzes,
    createdAt: data.created_at,
  });
}
