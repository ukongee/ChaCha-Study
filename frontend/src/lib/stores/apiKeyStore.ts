"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ApiKeyState {
  apiKey: string;
  model: string;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  isConfigured: () => boolean;
}

export const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set, get) => ({
      apiKey: "",
      model: "gpt-5.3",

      setApiKey: (apiKey) => {
        localStorage.setItem("aiApiKey", apiKey);
        set({ apiKey });
      },

      setModel: (model) => set({ model }),

      isConfigured: () => !!get().apiKey,
    }),
    {
      name: "api-key-storage",
    }
  )
);

export const AI_MODELS = [
  { value: "gpt-5.3", label: "GPT-5.3 Chat", provider: "OpenAI" },
  { value: "claude-sonnet-4-6", label: "Claude 4.6 Sonnet", provider: "Claude" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Gemini" },
  { value: "gpt-5.4-mini", label: "GPT-5.4 mini", provider: "OpenAI" },
  { value: "claude-haiku-4-5", label: "Claude 4.5 Haiku", provider: "Claude" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Gemini" },
];
