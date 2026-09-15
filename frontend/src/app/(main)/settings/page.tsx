"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, Trash2, ExternalLink, ChevronDown, ChevronUp, Shield, LogIn, KeyRound, Copy, ListChecks, Loader2 } from "lucide-react";
import { useApiKey } from "@/hooks/useApiKey";
import { identifyUser, clearUserId } from "@/hooks/useUserId";
import { toast } from "sonner";
import Image from "next/image";

const STEPS = [
  {
    icon: ExternalLink,
    title: "포털 접속",
    desc: "aiportal.cnu.ac.kr에 접속합니다.",
  },
  {
    icon: LogIn,
    title: "로그인",
    desc: "충남대학교 포털 계정으로 로그인합니다.",
  },
  {
    icon: KeyRound,
    title: "API 키 메뉴",
    desc: "'API 키 관리' 메뉴에서 새 키를 발급합니다.",
  },
  {
    icon: Copy,
    title: "복사 후 붙여넣기",
    desc: "발급된 키를 복사해 아래 입력란에 붙여넣으세요.",
  },
];

interface ModelCheck {
  /** 게이트웨이가 이 키로 제공하는 모델 ID */
  available: string[];
  /** 앱이 실제로 요청하는 모델 */
  configured: { smart: string; fast: string; vision: string };
  fallbacks: string[];
  /** configured 중 available 에 없는 것 — 404의 직접 원인 */
  missing: string[];
}

export default function SettingsPage() {
  const { apiKey, setApiKey, clearApiKey } = useApiKey();
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [models, setModels] = useState<ModelCheck | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSave() {
    const key = input.trim();
    if (!key) return;
    setApiKey(key);
    setInput("");
    // Link this key to a user_id (creates one if new key)
    await identifyUser(key).catch(() => {});
    toast.success("API 키가 저장되었습니다. 페이지를 새로고침합니다...");
    setTimeout(() => window.location.reload(), 800);
  }

  /**
   * 게이트웨이가 이 키로 제공하는 모델 목록을 확인한다.
   * 앱이 요청하는 모델이 여기 없으면 AI 기능이 404로 실패한다.
   */
  async function handleCheckModels() {
    if (!apiKey) return;
    setChecking(true);
    try {
      const res = await fetch("/api/ai/models", { headers: { "X-AI-Api-Key": apiKey } });
      if (!res.ok) throw new Error(await res.text());
      setModels(await res.json());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "모델 목록을 불러오지 못했습니다.");
    } finally {
      setChecking(false);
    }
  }

  function handleClear() {
    if (!confirm("API 키를 삭제하시겠습니까?")) return;
    clearApiKey();
    clearUserId();
    toast.success("API 키가 삭제되었습니다.");
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Image src="/chacha.webp" alt="차차" width={48} height={48} className="object-contain" />
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F1729]">설정</h1>
          <p className="text-sm text-[#5B6887]">AI 기능을 사용하려면 CNU AI API 키가 필요합니다.</p>
        </div>
      </div>

      {/* API Key card */}
      <div className="bg-white border border-[#D1D9F0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-[#1A3FAA]" />
          </div>
          <div>
            <p className="text-base font-bold text-[#0F1729]">CNU AI API 키</p>
            <p className="text-sm text-[#5B6887]">충남대학교 AI 포털에서 발급받은 키를 입력하세요.</p>
          </div>
        </div>

        {/* Saved key display */}
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

        {/* Input */}
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
      </div>

      {/* Security note */}
      <div className="mt-3 p-4 bg-white border border-[#D1D9F0] rounded-xl shadow-sm flex gap-3 items-start">
        <Shield className="w-4 h-4 text-[#1A3FAA] mt-0.5 shrink-0" />
        <p className="text-sm text-[#5B6887] leading-relaxed">
          입력한 API 키는 <span className="text-[#0F1729] font-semibold">이 기기에만 저장</span>되며, 차차 서버나 외부로 전송되지 않습니다.
          AI 기능을 실행할 때 CNU AI 포털로만 직접 전달됩니다.
        </p>
      </div>

      {/* Model availability check */}
      {apiKey && (
        <div className="mt-4 bg-white border border-[#D1D9F0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div>
              <p className="text-sm font-bold text-[#0F1729]">사용 가능한 모델 확인</p>
              <p className="text-xs text-[#5B6887] mt-0.5">
                AI 기능이 404로 실패하면, 앱이 요청하는 모델을 이 키가 쓸 수 없는 경우입니다.
              </p>
            </div>
            <button
              onClick={handleCheckModels}
              disabled={checking}
              className="shrink-0 px-3 py-2 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] disabled:opacity-40 text-[#1A3FAA] text-xs font-semibold transition flex items-center gap-1.5"
            >
              {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListChecks className="w-3.5 h-3.5" />}
              확인
            </button>
          </div>

          {models && (
            <div className="mt-4 space-y-3">
              {models.missing.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs font-semibold text-red-600 mb-1">이 키로 사용할 수 없는 모델</p>
                  <p className="text-xs text-red-700 font-mono break-all">{models.missing.join(", ")}</p>
                  <p className="text-xs text-[#5B6887] mt-1.5 leading-relaxed">
                    Vercel 환경변수 <span className="font-mono">AI_SMART_MODEL</span> /{" "}
                    <span className="font-mono">AI_FAST_MODEL</span> 을 아래 목록의 ID로 설정하세요.
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-[#0F1729] mb-1.5">
                  게이트웨이 제공 모델 ({models.available.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {models.available.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-1 rounded-lg bg-[#F0F4FF] border border-[#D1D9F0] text-[11px] font-mono text-[#0F1729]"
                    >
                      {m}
                    </span>
                  ))}
                  {models.available.length === 0 && (
                    <span className="text-xs text-[#8B96B0]">게이트웨이가 목록을 제공하지 않습니다.</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#0F1729] mb-1.5">앱이 요청하는 모델</p>
                <div className="space-y-1">
                  {(
                    [
                      ["요약·퀴즈·채팅", models.configured.smart],
                      ["플래시카드·암기", models.configured.fast],
                      ["이미지 PDF 해설", models.configured.vision],
                    ] as const
                  ).map(([label, id]) => {
                    const ok = models.available.length === 0 || models.available.includes(id);
                    return (
                      <div key={label} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-[#5B6887]">{label}</span>
                        <span className={`font-mono ${ok ? "text-[#0F1729]" : "text-red-600 line-through"}`}>{id}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* How to get API key */}
      <div className="mt-4 bg-white border border-[#D1D9F0] rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setGuideOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F8FAFF] transition"
        >
          <span className="text-sm font-semibold text-[#0F1729]">API 키 발급 방법</span>
          {guideOpen ? (
            <ChevronUp className="w-4 h-4 text-[#8B96B0]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8B96B0]" />
          )}
        </button>

        {guideOpen && (
          <div className="px-5 pb-5 border-t border-[#EEF2FF]">
            <div className="grid grid-cols-2 gap-3 mt-4">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex flex-col gap-2 p-3.5 bg-[#F8FAFF] border border-[#EEF2FF] rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1A3FAA] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <Icon className="w-3.5 h-3.5 text-[#1A3FAA]" />
                      <span className="text-xs font-semibold text-[#0F1729]">{step.title}</span>
                    </div>
                    <p className="text-xs text-[#5B6887] leading-relaxed pl-1">{step.desc}</p>
                  </div>
                );
              })}
            </div>

            <a
              href="https://aiportal.cnu.ac.kr/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] text-white text-sm font-semibold transition shadow-md shadow-blue-200"
            >
              <ExternalLink className="w-4 h-4" />
              발급하러 가기
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
