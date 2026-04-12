"use client";

import { useState, useEffect, useRef } from "react";
import apiClient from "@/lib/api/client";
import type { SummaryResponse } from "@/types/study.types";
import { Loader2, ChevronDown, Copy, Check, RefreshCw } from "lucide-react";

interface Props {
  documentId: string;
  pageCount: number;
  autoGenerate?: boolean;
}

export default function SummaryTab({ documentId, pageCount, autoGenerate }: Props) {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [checked, setChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const autoTriggered = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/api/ai/${documentId}/summary`);
        if (res.data) setData(res.data);
      } catch { /* 404 = 미생성 */ }
      setChecked(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (checked && !data && !generating && autoGenerate && !autoTriggered.current) {
      autoTriggered.current = true;
      generate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, autoGenerate]);

  async function generate(force = false) {
    setGenerating(true);
    try {
      const res = await apiClient.post(`/api/ai/${documentId}/summary`, { force });
      setData(res.data);
    } catch {
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!data) return;
    const pages = data.pages ?? [];
    const text = [
      data.briefSummary,
      "",
      ...pages.map((p) =>
        `[p.${p.page}] ${p.title}\n${p.summary}${p.detailedExplanation ? `\n${p.detailedExplanation}` : ""}`
      ),
    ].join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const pages = data?.pages ?? [];
  const generatedCount = pages.length;
  const total = data?.totalPages ?? pageCount;
  const isComplete = data?.complete ?? generatedCount >= total;
  const nextStart = generatedCount + 1;
  const nextEnd = Math.min(nextStart + 9, total);

  if (!checked) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 animate-spin text-[#8B96B0]" />
      </div>
    );
  }

  if (!data && !generating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5">
        <img src="/chacha.webp" alt="차차" className="w-16 h-16 object-contain opacity-50" />
        <div className="text-center">
          <p className="text-base font-bold text-[#0F1729] mb-1">페이지별 해설 요약</p>
          <p className="text-sm text-[#5B6887]">
            PDF와 나란히 보면서 공부할 수 있는 페이지별 설명을 생성합니다.
          </p>
          <p className="text-sm text-[#8B96B0] mt-1">
            10페이지 단위로 생성되며, 이어서 추가할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => generate(false)}
          className="px-6 py-3 rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] text-white text-base font-semibold transition shadow-md shadow-blue-200"
        >
          1~{Math.min(10, total)}페이지 요약 생성
        </button>
      </div>
    );
  }

  if (generating && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#1A3FAA]" />
        <p className="text-[#5B6887] text-base">AI가 분석 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[#0F1729]">요약</h2>
          <span className="text-sm text-[#8B96B0]">{generatedCount}/{total}페이지</span>
          {isComplete && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-600 border border-green-200">완료</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-sm text-[#8B96B0] hover:text-[#1A3FAA] transition font-medium"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "복사됨" : "복사"}
          </button>
          <button
            onClick={() => generate(true)}
            disabled={generating}
            className="flex items-center gap-1.5 text-sm text-[#8B96B0] hover:text-[#1A3FAA] disabled:opacity-30 transition font-medium"
            title="처음부터 재생성"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            재생성
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {data && (
          <div className="space-y-5 pb-6">
            {/* 전체 요약 */}
            {data.briefSummary && (
              <div className="bg-[#EEF2FF] border border-[#A8B8E8] rounded-xl p-4">
                <p className="text-sm text-[#1A3FAA] font-semibold mb-1.5">전체 요약</p>
                <p className="text-base text-[#1A2050] leading-relaxed">{data.briefSummary}</p>
              </div>
            )}

            {/* 이어서 생성 중 */}
            {generating && (
              <div className="flex items-center gap-2 text-sm text-[#5B6887] py-1">
                <Loader2 className="w-4 h-4 animate-spin text-[#1A3FAA]" />
                {nextStart}~{nextEnd}페이지 생성 중...
              </div>
            )}

            {/* 페이지별 카드 */}
            {pages.length > 0 && (
              <section>
                <p className="text-sm text-[#5B6887] font-semibold mb-3 uppercase tracking-wide">
                  페이지별 설명
                </p>
                <div className="space-y-3">
                  {pages.map((page) => (
                    <div key={page.page} className="bg-white border border-[#D1D9F0] rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#1A3FAA] font-mono shrink-0 border border-[#A8B8E8]">
                          p.{page.page}
                        </span>
                        <span className="text-base font-bold text-[#0F1729]">{page.title}</span>
                      </div>
                      <p className="text-sm text-[#5B6887] leading-relaxed mb-3 border-l-2 border-[#1A3FAA]/30 pl-3">
                        {page.summary}
                      </p>
                      {(page.detailedExplanation ?? page.easyExplanation) && (
                        <p className="text-base text-[#1A2050] leading-relaxed whitespace-pre-wrap mb-3">
                          {page.detailedExplanation ?? page.easyExplanation}
                        </p>
                      )}
                      {page.keyTerms && page.keyTerms.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#D1D9F0]">
                          {page.keyTerms.map((term, j) => (
                            <span key={j} className="px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#1A3FAA] text-sm border border-[#A8B8E8]">
                              {term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 다음 구간 생성 버튼 */}
            {!isComplete && !generating && (
              <button
                onClick={() => generate(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#A8B8E8] bg-[#EEF2FF] hover:bg-[#D1D9F0] text-[#1A3FAA] text-base font-semibold transition"
              >
                <ChevronDown className="w-4 h-4" />
                {nextStart}~{nextEnd}페이지 더 요약하기
              </button>
            )}

            {/* 구형 캐시 */}
            {isComplete && pages.length === 0 && (
              <div className="p-4 bg-white border border-[#D1D9F0] rounded-xl text-center">
                <p className="text-sm text-[#5B6887] mb-2">페이지별 설명이 없습니다.</p>
                <button onClick={() => generate(true)} className="text-sm text-[#1A3FAA] hover:underline transition">
                  새 형식으로 재생성 →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
