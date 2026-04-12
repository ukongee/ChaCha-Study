"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api/client";
import TabShell from "@/components/study/TabShell";
import type { ConceptsResponse } from "@/types/study.types";
import { BookOpen, ScanText } from "lucide-react";

type Mode = "all" | "range" | null;

export default function ConceptsTab({ documentId }: { documentId: string }) {
  const [data, setData] = useState<ConceptsResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  // Load cached data on mount — skip mode selection if cache exists
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.post(`/api/ai/${documentId}/concepts`, { force: false });
        if (res.data?.concepts?.length > 0) {
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
      const res = await apiClient.post(`/api/ai/${documentId}/concepts`, payload);
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
    setExpanded(null);
  }

  // Mode selection screen
  if (!data && !generating && mode === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">핵심 개념 생성</h2>
          <p className="text-sm text-white/40">어떤 방식으로 생성하시겠습니까?</p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          <button
            onClick={() => setMode("all")}
            className="flex flex-col items-center gap-3 p-6 bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-2xl transition text-center"
          >
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <div>
              <p className="text-sm font-semibold text-white">전체 개념</p>
              <p className="text-xs text-white/40 mt-0.5">모든 페이지 추출</p>
            </div>
          </button>
          <button
            onClick={() => setMode("range")}
            className="flex flex-col items-center gap-3 p-6 bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-2xl transition text-center"
          >
            <ScanText className="w-6 h-6 text-purple-400" />
            <div>
              <p className="text-sm font-semibold text-white">페이지 범위 개념</p>
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
          <p className="text-sm text-white/40">추출할 페이지 범위를 입력하세요</p>
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
      title="개념 정리"
      isLoading={generating && !data}
      isEmpty={!data}
      generating={generating}
      onGenerate={reset}
      onRegenerate={() => generate(true)}
    >
      {data && (
        <div className="space-y-2 pb-6">
          {data.concepts.map((concept, i) => (
            <button
              key={i}
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full text-left bg-white/3 hover:bg-white/5 border border-white/5 rounded-xl p-4 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{concept.term}</span>
                    {concept.sourcePage && (
                      <span className="text-xs text-white/30">p.{concept.sourcePage}</span>
                    )}
                  </div>
                  <p className={`text-xs text-white/50 leading-relaxed ${expanded === i ? "" : "line-clamp-1"}`}>
                    {concept.definition}
                  </p>
                </div>
                <span className="text-white/20 text-xs shrink-0 mt-0.5">{expanded === i ? "▲" : "▼"}</span>
              </div>

              {expanded === i && (
                <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
                  {concept.example && (
                    <div>
                      <p className="text-xs text-indigo-300/70 mb-1">예시</p>
                      <p className="text-xs text-white/50">{concept.example}</p>
                    </div>
                  )}
                  {concept.relatedTerms && concept.relatedTerms.length > 0 && (
                    <div>
                      <p className="text-xs text-white/30 mb-1">관련 개념</p>
                      <div className="flex flex-wrap gap-1.5">
                        {concept.relatedTerms.map((t, j) => (
                          <span key={j} className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 text-xs">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </TabShell>
  );
}
