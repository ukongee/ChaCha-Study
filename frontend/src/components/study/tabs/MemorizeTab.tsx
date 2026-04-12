"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api/client";
import TabShell from "@/components/study/TabShell";
import type { MemorizeResponse } from "@/types/study.types";
import { BookOpen, ScanText } from "lucide-react";

type Mode = "all" | "range" | null;

export default function MemorizeTab({ documentId }: { documentId: string }) {
  const [data, setData] = useState<MemorizeResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  // Load cached data on mount — skip mode selection if cache exists
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.post(`/api/ai/${documentId}/memorize`, { force: false });
        if (res.data?.sections?.length > 0) {
          setData(res.data);
          setMode("all");
        }
      } catch { /* no cache — show mode selection */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-trigger generation when mode === "all"
  useEffect(() => {
    if (mode === "all" && !data && !generating) {
      generate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function generate(force = false) {
    setGenerating(true);
    try {
      const payload: Record<string, unknown> = { force };
      if (mode === "range" && rangeFrom && rangeTo) {
        payload.pageFrom = Number(rangeFrom);
        payload.pageTo = Number(rangeTo);
      }
      const res = await apiClient.post(`/api/ai/${documentId}/memorize`, payload);
      setData(res.data);
    } catch {
    } finally {
      setGenerating(false);
    }
  }

  function reset() {
    setData(null);
    setMode(null);
    setRangeFrom("");
    setRangeTo("");
  }

  const copyText = data
    ? data.sections.map((s) =>
        `## ${s.title}\n${s.mustKnow.map((m) => `- ${m}`).join("\n")}\n키워드: ${s.keywords.join(", ")}${s.tip ? `\n💡 ${s.tip}` : ""}`
      ).join("\n\n")
    : "";

  // Mode selection screen
  if (!data && !generating && mode === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">암기 사항 생성</h2>
          <p className="text-sm text-white/40">어떤 방식으로 생성하시겠습니까?</p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          <button
            onClick={() => setMode("all")}
            className="flex flex-col items-center gap-3 p-6 bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-2xl transition text-center"
          >
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <div>
              <p className="text-sm font-semibold text-white">전체 암기</p>
              <p className="text-xs text-white/40 mt-0.5">모든 페이지 추출</p>
            </div>
          </button>
          <button
            onClick={() => setMode("range")}
            className="flex flex-col items-center gap-3 p-6 bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-2xl transition text-center"
          >
            <ScanText className="w-6 h-6 text-purple-400" />
            <div>
              <p className="text-sm font-semibold text-white">페이지 범위 암기</p>
              <p className="text-xs text-white/40 mt-0.5">특정 페이지만 선택</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Page range input screen
  if (!data && !generating && mode === "range") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">페이지 범위 선택</h2>
          <p className="text-sm text-white/40">암기 노트를 생성할 페이지 범위를 입력하세요</p>
        </div>
        <div className="flex items-center gap-2 w-full max-w-xs">
          <input
            type="number"
            value={rangeFrom}
            onChange={(e) => setRangeFrom(e.target.value)}
            placeholder="시작 페이지"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500"
          />
          <span className="text-white/30 text-sm">~</span>
          <input
            type="number"
            value={rangeTo}
            onChange={(e) => setRangeTo(e.target.value)}
            placeholder="끝 페이지"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2 w-full max-w-xs">
          <button onClick={reset} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/40 text-sm hover:bg-white/10 transition">
            취소
          </button>
          <button
            onClick={() => generate(false)}
            disabled={!rangeFrom || !rangeTo}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm transition"
          >
            생성
          </button>
        </div>
      </div>
    );
  }

  return (
    <TabShell
      title="암기 노트"
      isLoading={generating && !data}
      isEmpty={!data}
      generating={generating}
      onGenerate={reset}
      onRegenerate={() => generate(true)}
      showCopy
      copyText={copyText}
    >
      {data && (
        <div className="space-y-4 pb-6">
          {data.sections.map((section, i) => (
            <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">{section.title}</h3>

              <div className="mb-3">
                <p className="text-xs text-red-300/70 font-medium mb-1.5">반드시 암기</p>
                <ul className="space-y-1.5">
                  {section.mustKnow.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-white/70">
                      <span className="mt-1 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {section.keywords.map((kw, j) => (
                  <span key={j} className="px-2 py-0.5 rounded-md bg-indigo-600/20 text-indigo-300 text-xs border border-indigo-500/20">
                    {kw}
                  </span>
                ))}
              </div>

              {section.tip && (
                <div className="mt-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-300">💡 {section.tip}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </TabShell>
  );
}
