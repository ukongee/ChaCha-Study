"use client";

import { RefreshCw, Copy, Check } from "lucide-react";
import { useState } from "react";

interface TabShellProps {
  title: string;
  isLoading: boolean;
  isEmpty: boolean;
  emptyLabel?: string;
  onGenerate: () => void;
  onRegenerate?: () => void;
  generating: boolean;
  children: React.ReactNode;
  showCopy?: boolean;
  copyText?: string;
  headerExtra?: React.ReactNode;
}

export default function TabShell({
  title,
  isLoading,
  isEmpty,
  emptyLabel = "아직 생성된 내용이 없습니다.",
  onGenerate,
  onRegenerate,
  generating,
  children,
  showCopy,
  copyText,
  headerExtra,
}: TabShellProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyText) return;
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
        <h2 className="text-base font-bold text-[#0F1729]">{title}</h2>
        <div className="flex items-center gap-2">
          {headerExtra}
          {showCopy && !isEmpty && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-sm text-[#8B96B0] hover:text-[#1A3FAA] transition font-medium"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? "복사됨" : "복사"}
            </button>
          )}
          {!isEmpty && onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={generating}
              className="flex items-center gap-1.5 text-sm text-[#8B96B0] hover:text-[#1A3FAA] disabled:opacity-40 transition font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
              재생성
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {isLoading || generating ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <img src="/chacha.webp" alt="차차" className="w-16 h-16 object-contain animate-pulse" />
            <p className="text-[#5B6887] text-base font-medium">AI가 분석 중입니다...</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-48 gap-5">
            <img src="/chacha.webp" alt="차차" className="w-16 h-16 object-contain opacity-50" />
            <p className="text-[#8B96B0] text-base">{emptyLabel}</p>
            <button
              onClick={onGenerate}
              className="px-6 py-3 rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] text-white text-base font-semibold transition shadow-md shadow-blue-200"
            >
              생성하기
            </button>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
