/**
 * Server-side user resolution.
 * NEVER trusts client-sent user_id.
 * Resolves user_id from api_key on every request via user_api_keys table.
 *
 * Falls back to api_key_hash column on documents for legacy records
 * (documents created before 006_user_id migration ran).
 */
import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Resolve user_id from the X-AI-Api-Key header.
 * Returns null if the key is missing or not yet registered via /api/auth/identify.
 */
export async function resolveUserId(req: Request): Promise<string | null> {
  const apiKey = req.headers.get("x-ai-api-key");
  if (!apiKey) return null;

  const keyHash = hashApiKey(apiKey);
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("user_api_keys")
    .select("user_id")
    .eq("key_hash", keyHash)
    .single();

  return data?.user_id ?? null;
}

/**
 * Same as resolveUserId but also returns the raw keyHash
 * (needed for legacy api_key_hash fallback in document queries).
 */
export async function resolveUserContext(req: Request): Promise<{
  userId: string | null;
  keyHash: string | null;
}> {
  const apiKey = req.headers.get("x-ai-api-key");
  if (!apiKey) return { userId: null, keyHash: null };

  const keyHash = hashApiKey(apiKey);
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("user_api_keys")
    .select("user_id")
    .eq("key_hash", keyHash)
    .single();

  return { userId: data?.user_id ?? null, keyHash };
}
