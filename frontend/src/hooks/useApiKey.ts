"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "cnu_ai_api_key";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });
  const isLoaded = true;

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKeyState(key);
  }, []);

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKeyState(null);
  }, []);

  /** Returns fetch headers with the API key included */
  const authHeaders = useCallback((): HeadersInit => {
    return apiKey ? { "X-AI-Api-Key": apiKey } : {};
  }, [apiKey]);

  return { apiKey, setApiKey, clearApiKey, authHeaders, isLoaded };
}
