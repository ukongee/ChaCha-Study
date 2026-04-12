"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "cnu_ai_model";
const DEFAULT_MODEL = "gpt-4o-mini";

export function useModel() {
  const [model, setModelState] = useState(DEFAULT_MODEL);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setModelState(stored);
  }, []);

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
