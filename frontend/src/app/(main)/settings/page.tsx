"use client";

import { useState } from "react";
import { Key, Eye, EyeOff, Check, Trash2, ExternalLink } from "lucide-react";
import { useApiKey } from "@/hooks/useApiKey";
import { toast } from "sonner";

export default function SettingsPage() {
  const { apiKey, setApiKey, clearApiKey } = useApiKey();
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);

  function handleSave() {
    const key = input.trim();
    if (!key) return;
    setApiKey(key);
    setInput("");
    toast.success("API 키가 저장되었습니다.");
  }

  function handleClear() {
    if (!confirm("API 키를 삭제하시겠습니까?")) return;
    clearApiKey();
    toast.success("API 키가 삭제되었습니다.");
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-extrabold text-[#0F1729] mb-1">설정</h1>
      <p className="text-base text-[#5B6887] mb-8">API 키는 브라우저 localStorage에만 저장됩니다.</p>

      <div className="bg-white border border-[#D1D9F0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
            <Key className="w-5 h-5 text-[#1A3FAA]" />
          </div>
          <div>
            <p className="text-base font-bold text-[#0F1729]">CNU AI API 키</p>
            <p className="text-sm text-[#5B6887]">AI 기능 사용에 필요합니다.</p>
          </div>
        </div>

        {apiKey && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-green-600 font-semibold mb-0.5">현재 저장된 키</p>
              <p className="text-sm text-[#5B6887] font-mono truncate">
                {showCurrent ? apiKey : apiKey.slice(0, 8) + "••••••••" + apiKey.slice(-4)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setShowCurrent((s) => !s)} className="text-[#8B96B0] hover:text-[#1A3FAA] transition">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={handleClear} className="text-[#8B96B0] hover:text-red-500 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder={apiKey ? "새 키로 교체하려면 입력하세요" : "API 키를 붙여넣으세요"}
              className="w-full bg-[#F0F4FF] border border-[#D1D9F0] rounded-xl px-4 py-3 pr-11 text-base text-[#0F1729] placeholder-[#8B96B0] focus:outline-none focus:border-[#1A3FAA] focus:ring-2 focus:ring-[#1A3FAA]/20 transition"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B96B0] hover:text-[#1A3FAA] transition"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={!input.trim()}
            className="w-full py-3 rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] disabled:opacity-40 text-white text-base font-semibold transition flex items-center justify-center gap-2 shadow-md shadow-blue-200"
          >
            <Check className="w-4 h-4" />
            {apiKey ? "키 교체" : "저장"}
          </button>
        </div>

        <a
          href="https://aiportal.cnu.ac.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-[#1A3FAA] hover:text-[#2B52CC] transition mt-4 font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          CNU AI 포털에서 API 키 발급받기
        </a>
      </div>

      <div className="mt-4 p-4 bg-white border border-[#D1D9F0] rounded-xl shadow-sm">
        <p className="text-sm text-[#8B96B0] leading-relaxed">
          API 키는 귀하의 브라우저 localStorage에만 저장되며, 서버 데이터베이스에 기록되지 않습니다.
          AI 기능 사용 시 HTTP 헤더(X-AI-Api-Key)를 통해 서버로 전달되어 LLM 호출에만 사용됩니다.
        </p>
      </div>
    </div>
  );
}
