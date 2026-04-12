"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "cnu_ai_model";
const DEFAULT_MODEL = "gpt-4o-mini";

export function useModel() {
  const [model, setModelState] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_MODEL;
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_MODEL;
  });

  const setModel = useCallback((m: string) => {
    localStorage.setItem(STORAGE_KEY, m);
    setModelState(m);
  }, []);

  return { model, setModel };
}

export function getStoredModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_MODEL;
}
