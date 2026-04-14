/**
 * Client-side session token management.
 *
 * The client NEVER stores or sends user_id.
 * user_id is resolved server-side from api_key on every request.
 *
 * session_token (server-issued) is stored in localStorage ONLY for
 * the key-change merge flow: when a user regenerates their CNU AI key,
 * sending the session_token lets the server link the new key to the
 * same user_id instead of creating a new one.
 */

const SESSION_TOKEN_KEY = "chachastudy_session_token";

let _memToken: string | null = null;

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY) ?? _memToken;
  } catch {
    return _memToken;
  }
}

export function saveSessionToken(token: string): void {
  _memToken = token;
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {}
}

export function clearSessionToken(): void {
  _memToken = null;
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
}

/**
 * Register the api_key with the server.
 * Sends the stored session_token so the server can merge the key
 * to an existing user if the key changed.
 * Saves the returned session_token for future key changes.
 */
export async function identifyUser(apiKey: string): Promise<void> {
  try {
    const sessionToken = getSessionToken();
    const res = await fetch("/api/auth/identify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ai-api-key": apiKey,
      },
      body: JSON.stringify({ sessionToken }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.sessionToken) saveSessionToken(data.sessionToken);
  } catch {
    // Non-fatal — document access still works via api_key_hash fallback
  }
}

// Legacy compat: getStoredUserId is no longer used but kept to avoid import errors
// during the transition. Remove once all callers are updated.
export function getStoredUserId(): string | null { return null; }
export function saveUserId(_id: string): void {}
export function clearUserId(): void { clearSessionToken(); }
