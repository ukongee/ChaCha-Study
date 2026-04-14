/**
 * Persistent device identity — independent of the API key.
 * A random UUID is generated on first visit and stored in localStorage.
 * This survives API key changes, so users never lose their documents.
 */

const DEVICE_KEY = "chachastudy_device_id";

let _memDeviceId: string | null = null;

/** Returns (and lazily creates) the persistent device ID. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";

  if (_memDeviceId) return _memDeviceId;

  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    _memDeviceId = id;
    return id;
  } catch {
    // localStorage blocked (e.g. private browsing with strict settings)
    if (!_memDeviceId) _memDeviceId = crypto.randomUUID();
    return _memDeviceId;
  }
}
