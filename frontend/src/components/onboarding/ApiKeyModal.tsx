"use client";

import { useState } from "react";
import { Key, ExternalLink, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useApiKey } from "@/hooks/useApiKey";

export default function ApiKeyModal() {
  const { apiKey, setApiKey, isLoaded } = useApiKey();
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  // Don't render until localStorage is read
  if (!isLoaded) return null;
  // Already have a key
  if (apiKey) return null;

  async function handleSave() {
    const key = input.trim();
    if (!key) {
      setError("API 키를 입력해주세요.");
      return;
    }

    setValidating(true);
    setError("");

    try {
      // Lightweight validation: call models list endpoint
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_BASE_URL ?? "https://factchat-cloud.mindlogic.ai/v1/gateway"}/models`, {
        headers: { Authorization: `Bearer ${key}` },
      });

      if (!res.ok && res.status === 401) {
        setError("유효하지 않은 API 키입니다. 다시 확인해주세요.");
        return;
      }
    } catch {
      // Network errors are OK — key format looks valid enough
    }

    setApiKey(key);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 shadow-2xl">
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 mx-auto mb-6">
          <Key className="w-7 h-7 text-indigo-400" />
        </div>

        <h2 className="text-xl font-semibold text-white text-center mb-1">
          CNU AI API 키 입력
        </h2>
        <p className="text-sm text-white/50 text-center mb-6">
          키는 브라우저에만 저장되며 서버로 전송되지 않습니다.
        </p>

        {/* Input */}
        <div className="relative mb-3">
          <input
            type={show ? "text" : "password"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="API 키를 붙여넣으세요"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={validating}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition mb-5"
        >
          {validating ? "확인 중..." : "저장하고 시작하기"}
        </button>

        {/* Info */}
        <div className="border-t border-white/10 pt-5 space-y-2">
          <div className="flex items-start gap-2 text-xs text-white/40">
            <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-500/70" />
            <span>키는 localStorage에만 저장 — 서버 DB에 저장되지 않습니다.</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-white/40">
            <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-500/70" />
            <span>AI 기능 사용 시 요청 헤더로만 전달됩니다.</span>
          </div>
          <a
            href="https://factchat-cloud.mindlogic.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            CNU AI 포털에서 API 키 발급
          </a>
        </div>
      </div>
    </div>
  );
}
