/**
 * POST /api/auth/identify
 *
 * Registers an API key and returns a server-issued session token.
 * The client NEVER receives or sends user_id.
 *
 * Uses resolveUser() internally — which handles the full fallback chain:
 *   user_api_keys → documents.api_key_hash (legacy) → create new user
 *
 * Merge flow (key change without data loss):
 *   - If sessionToken is provided and valid → new key linked to same user_id
 *   - Otherwise → resolveUser() handles it (may find via legacy fallback)
 */
import { createServiceClient } from "@/lib/supabase/service";
import { resolveUser, hashApiKey } from "@/lib/resolveUser";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-ai-api-key");
  if (!apiKey) return new Response("API 키가 필요합니다.", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sessionToken: string | null = body.sessionToken ?? null;

  const keyHash = hashApiKey(apiKey);
  const supabase = createServiceClient();

  // ── Key-change merge: sessionToken → existing user_id + link new key ──
  if (sessionToken) {
    const { data: session } = await supabase
      .from("user_sessions")
      .select("user_id")
      .eq("token", sessionToken)
      .maybeSingle();

    if (session) {
      // Check if new key already mapped to a DIFFERENT user — don't cross-link
      const { data: existingMapping } = await supabase
        .from("user_api_keys")
        .select("user_id")
        .eq("key_hash", keyHash)
        .maybeSingle();

      if (!existingMapping) {
        // Safe to merge: link new key to session's user
        await supabase
          .from("user_api_keys")
          .insert({ key_hash: keyHash, user_id: session.user_id })
          .then(({ error }) => {
            if (error) console.error("[identify] merge insert error:", error.message);
          });
      }

      await supabase
        .from("user_sessions")
        .update({ last_used_at: new Date().toISOString() })
        .eq("token", sessionToken);

      return Response.json({ sessionToken });
    }
  }

  // ── Normal flow: resolveUser (handles all fallback cases) ────────────
  const ctx = await resolveUser(req);
  if (!ctx) {
    return new Response("사용자 처리에 실패했습니다.", { status: 500 });
  }

  // Issue or refresh session token for this user
  const token = await upsertSession(supabase, ctx.userId, sessionToken);
  return Response.json({ sessionToken: token });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertSession(supabase: any, userId: string, existingToken: string | null): Promise<string> {
  if (existingToken) {
    const { data } = await supabase
      .from("user_sessions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("token", existingToken)
      .eq("user_id", userId)
      .select("token")
      .maybeSingle();
    if (data?.token) return data.token;
  }

  const { data } = await supabase
    .from("user_sessions")
    .insert({ user_id: userId })
    .select("token")
    .single();

  return data?.token ?? crypto.randomUUID();
}
