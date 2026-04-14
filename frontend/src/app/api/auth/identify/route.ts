/**
 * POST /api/auth/identify
 *
 * Registers an API key and returns a server-issued session token.
 * The client NEVER receives user_id — all identity resolution is server-side.
 *
 * Merge logic (key change without data loss):
 *   - If sessionToken is provided and valid → new key is linked to the same user_id
 *   - If no sessionToken (or invalid) → new user is created
 *
 * Multi-device:
 *   - Same api_key on any device → always resolves to the same user_id (via user_api_keys)
 *   - No session token needed for read access on a second device
 */
import { createServiceClient } from "@/lib/supabase/service";
import { hashApiKey } from "@/lib/resolveUser";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-ai-api-key");
  if (!apiKey) return new Response("API 키가 필요합니다.", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sessionToken: string | null = body.sessionToken ?? null;

  const keyHash = hashApiKey(apiKey);
  const supabase = createServiceClient();

  // ── Case 1: Key already registered ──────────────────────────────────
  const { data: existingKey } = await supabase
    .from("user_api_keys")
    .select("user_id")
    .eq("key_hash", keyHash)
    .single();

  if (existingKey) {
    // Refresh session (or create new one for this device)
    const token = await upsertSession(supabase, existingKey.user_id, sessionToken);
    return Response.json({ sessionToken: token });
  }

  // ── Case 2: New key — check if same user (key change / merge) ───────
  if (sessionToken) {
    const { data: session } = await supabase
      .from("user_sessions")
      .select("user_id")
      .eq("token", sessionToken)
      .single();

    if (session) {
      // Merge: link new key to existing user_id
      await supabase
        .from("user_api_keys")
        .insert({ key_hash: keyHash, user_id: session.user_id });

      await supabase
        .from("user_sessions")
        .update({ last_used_at: new Date().toISOString() })
        .eq("token", sessionToken);

      return Response.json({ sessionToken });
    }
  }

  // ── Case 3: Completely new user ──────────────────────────────────────
  const { data: user, error } = await supabase
    .from("users")
    .insert({})
    .select("id")
    .single();

  if (error || !user) {
    console.error("[identify] user insert error:", error?.message);
    return new Response("사용자 생성에 실패했습니다.", { status: 500 });
  }

  await supabase
    .from("user_api_keys")
    .insert({ key_hash: keyHash, user_id: user.id });

  const token = await upsertSession(supabase, user.id, null);
  return Response.json({ sessionToken: token }, { status: 201 });
}

// ── Helper ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertSession(supabase: any, userId: string, existingToken: string | null): Promise<string> {
  if (existingToken) {
    await supabase
      .from("user_sessions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("token", existingToken)
      .eq("user_id", userId);
    return existingToken;
  }

  const { data } = await supabase
    .from("user_sessions")
    .insert({ user_id: userId })
    .select("token")
    .single();

  return data?.token ?? crypto.randomUUID();
}
