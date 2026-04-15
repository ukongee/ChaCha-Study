/**
 * Server-side user resolution — the single source of truth for identity.
 *
 * Resolution order (NEVER change this):
 * 1. x-ai-api-key header missing or invalid format → null (401)
 * 2. Hash the key
 * 3. Check user_api_keys → found → return user_id
 * 4. Fallback: check documents.api_key_hash → found → migrate + return user_id
 * 5. Nothing found → create new user (with race-condition-safe upsert)
 *
 * Race condition handling:
 *   Two concurrent requests for the same new key both reach step 5.
 *   The first INSERT wins; the second hits a PK conflict.
 *   We catch that conflict and re-read the row the winner inserted.
 *
 * The client NEVER sends user_id. It cannot be spoofed.
 */
import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export interface UserContext {
  userId: string;
  keyHash: string;
}

/** Minimum sanity check — avoids creating users for obviously garbage keys. */
function isValidKeyFormat(key: string): boolean {
  return key.length >= 16 && key.length <= 512 && /^[\x20-\x7E]+$/.test(key);
}

/**
 * Resolves (or creates) the user for the given request.
 * Returns null if the api_key header is missing or malformed.
 */
export async function resolveUser(req: Request): Promise<UserContext | null> {
  const apiKey = req.headers.get("x-ai-api-key");
  if (!apiKey || !isValidKeyFormat(apiKey)) return null;

  const keyHash = hashApiKey(apiKey);
  const supabase = createServiceClient();

  // ── Step 1: known key ────────────────────────────────────────────────
  const { data: knownKey, error: keyErr } = await supabase
    .from("user_api_keys")
    .select("user_id")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (keyErr) console.error("[resolveUser] user_api_keys lookup:", keyErr.message);
  if (knownKey) return { userId: knownKey.user_id, keyHash };

  // ── Step 2: legacy fallback ──────────────────────────────────────────
  const { data: legacyDoc, error: legacyErr } = await supabase
    .from("documents")
    .select("user_id")
    .eq("api_key_hash", keyHash)
    .not("user_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (legacyErr) console.error("[resolveUser] legacy fallback:", legacyErr.message);

  if (legacyDoc?.user_id) {
    // Register key so future requests skip this fallback
    await supabase
      .from("user_api_keys")
      .upsert({ key_hash: keyHash, user_id: legacyDoc.user_id }, { onConflict: "key_hash" });
    return { userId: legacyDoc.user_id, keyHash };
  }

  // ── Step 3: new user (race-condition safe) ───────────────────────────
  const { data: newUser, error: createErr } = await supabase
    .from("users")
    .insert({})
    .select("id")
    .single();

  if (createErr || !newUser) {
    console.error("[resolveUser] user creation:", createErr?.message);
    return null;
  }

  const { error: insertErr } = await supabase
    .from("user_api_keys")
    .insert({ key_hash: keyHash, user_id: newUser.id });

  if (insertErr) {
    // PK conflict: another concurrent request already inserted this key.
    // Re-read the winner's row.
    if (insertErr.code === "23505") {
      const { data: winner } = await supabase
        .from("user_api_keys")
        .select("user_id")
        .eq("key_hash", keyHash)
        .maybeSingle();
      if (winner) return { userId: winner.user_id, keyHash };
    }
    console.error("[resolveUser] key insert:", insertErr.message);
    // Orphaned user — not ideal but non-fatal; return the user we created
    return { userId: newUser.id, keyHash };
  }

  return { userId: newUser.id, keyHash };
}

/**
 * Lightweight version — only returns the key hash (no DB calls).
 * Use for routes that still have the legacy api_key_hash column fallback.
 */
export function resolveKeyHash(req: Request): string | null {
  const apiKey = req.headers.get("x-ai-api-key");
  return apiKey ? hashApiKey(apiKey) : null;
}
