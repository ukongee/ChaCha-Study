"use client";

import { useState, useEffect, useRef } from "react";
import apiClient from "@/lib/api/client";
import TabShell from "@/components/study/TabShell";
import type { ExamPointsResponse } from "@/types/study.types";
import { Loader2 } from "lucide-react";

export default function ExamPointsTab({ documentId, autoGenerate }: { documentId: string; autoGenerate?: boolean }) {
  const [data, setData] = useState<ExamPointsResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [checked, setChecked] = useState(false);
  const autoTriggered = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/api/ai/${documentId}/exam-points`);
        if (res.data) setData(res.data);
      } catch { /* 404 = not yet generated */ }
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
      const res = await apiClient.post(`/api/ai/${documentId}/exam-points`, { force });
      setData(res.data);
    } catch {
    } finally {
      setGenerating(false);
    }
  }

  const copyText = data
    ? [
        "■ 출제 포인트",
        ...(data.examPoints ?? []).map((p) => `• [${p.topic}] ${p.point}`),
        "",
        "■ 암기 포인트",
        ...(data.memorizationPoints ?? []).map((m) => `• ${m.content}`),
        "",
        "■ 헷갈리는 개념",
        ...(data.confusingConcepts ?? []).map((c) => `• ${c.conceptA} vs ${c.conceptB}: ${c.difference}`),
      ].join("\n")
    : "";

  if (!checked) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 animate-spin text-[#8B96B0]" />
      </div>
    );
  }

  return (
    <TabShell
      title="시험 포인트"
      isLoading={generating && !data}
      isEmpty={!data}
      generating={generating}
      onGenerate={() => generate(false)}
      onRegenerate={() => generate(true)}
      showCopy
      copyText={copyText}
    >
      {data && (
        <div className="space-y-5 pb-6">
          {/* Exam Points */}
          {data.examPoints?.length > 0 && (
            <section>
              <p className="text-sm text-[#5B6887] font-semibold mb-2 uppercase tracking-wide">출제 가능 포인트</p>
              <div className="space-y-2">
                {data.examPoints.map((ep, i) => (
                  <div key={i} className="bg-white border border-[#D1D9F0] rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-sm px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#1A3FAA] border border-[#A8B8E8] font-semibold shrink-0">
                        {ep.topic}
                      </span>
                      {ep.page && <span className="text-sm text-[#8B96B0] shrink-0">p.{ep.page}</span>}
                    </div>
                    <p className="text-base text-[#1A2050] leading-relaxed">{ep.point}</p>
                    {ep.reason && (
                      <p className="text-sm text-amber-600 mt-1.5 leading-relaxed">출제 이유: {ep.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Memorization Points */}
          {data.memorizationPoints?.length > 0 && (
            <section>
              <p className="text-sm text-[#5B6887] font-semibold mb-2 uppercase tracking-wide">반드시 암기</p>
              <div className="space-y-1.5">
                {data.memorizationPoints.map((mp, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-base text-[#1A2050] leading-relaxed">{mp.content}</p>
                      {mp.page && <span className="text-sm text-[#8B96B0]">p.{mp.page}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Confusing Concepts */}
          {data.confusingConcepts?.length > 0 && (
            <section>
              <p className="text-sm text-[#5B6887] font-semibold mb-2 uppercase tracking-wide">헷갈리는 개념 비교</p>
              <div className="space-y-3">
                {data.confusingConcepts.map((cc, i) => (
                  <div key={i} className="bg-white border border-[#D1D9F0] rounded-xl p-4 shadow-sm">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-[#EEF2FF] border border-[#A8B8E8] rounded-lg p-2.5 text-center">
                        <p className="text-sm font-bold text-[#1A3FAA]">{cc.conceptA}</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-center">
                        <p className="text-sm font-bold text-purple-600">{cc.conceptB}</p>
                      </div>
                    </div>
                    <p className="text-base text-[#1A2050] leading-relaxed">
                      <span className="text-[#0F1729] font-semibold">핵심 차이 </span>
                      {cc.difference}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </TabShell>
  );
}
