/**
 * API Route에서 인증된 유저 가져오기
 * 미인증 시 401 Response 반환
 */
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, supabase, error: new Response("Unauthorized", { status: 401 }) };
  }

  return { user, supabase, error: null };
}
