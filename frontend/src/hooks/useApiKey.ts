"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "cnu_ai_api_key";

// 메모리 fallback — localStorage 차단 환경(Private 브라우징, Safari ITP 등)용
let _memKey: string | null = null;

/** localStorage 읽기 (실패 시 메모리 fallback) */
export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY) ?? _memKey;
  } catch {
    return _memKey;
  }
}

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const key = getStoredApiKey();
    _memKey = key;
    return key;
  });
  const isLoaded = true;

  const setApiKey = useCallback((key: string) => {
    _memKey = key;
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch { /* Private 브라우징 등 localStorage 차단 환경 */ }
    setApiKeyState(key);
  }, []);

  const clearApiKey = useCallback(() => {
    _memKey = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setApiKeyState(null);
  }, []);

  /** Returns fetch headers with the API key included */
  const authHeaders = useCallback((): HeadersInit => {
    return apiKey ? { "X-AI-Api-Key": apiKey } : {};
  }, [apiKey]);

  return { apiKey, setApiKey, clearApiKey, authHeaders, isLoaded };
}
