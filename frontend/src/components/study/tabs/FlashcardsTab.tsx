"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api/client";
import type { FlashcardItem } from "@/types/study.types";
import { ChevronLeft, ChevronRight, RotateCcw, X, Check, LayoutGrid, Plus, Loader2, ScanText, BookOpen } from "lucide-react";

interface FlashcardSetMeta {
  id: string;
  title: string;
  config_json: Record<string, unknown>;
  created_at: string;
}

interface FlashcardSetDetail {
  id: string;
  title: string;
  flashcards: FlashcardItem[];
}

// ── Flashcard player ──────────────────────────────────────────────────────
function FlashcardPlayer({ set, onBack }: { set: FlashcardSetDetail; onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [view, setView] = useState<"card" | "list">("card");

  const cards = set.flashcards;
  const card = cards[index];
  const progress = cards.length > 0 ? ((index + 1) / cards.length) * 100 : 0;

  function prev() { setFlipped(false); setIndex((i) => Math.max(0, i - 1)); }
  function next() { setFlipped(false); setIndex((i) => Math.min(cards.length - 1, i + 1)); }

  function markUnknown() {
    setUnknown((s) => { const n = new Set(s); n.add(index); return n; });
    setKnown((s) => { const n = new Set(s); n.delete(index); return n; });
    if (index < cards.length - 1) { setFlipped(false); setIndex((i) => i + 1); }
  }

  function markKnown() {
    setKnown((s) => { const n = new Set(s); n.add(index); return n; });
    setUnknown((s) => { const n = new Set(s); n.delete(index); return n; });
    if (index < cards.length - 1) { setFlipped(false); setIndex((i) => i + 1); }
  }

  function reset() { setIndex(0); setFlipped(false); setKnown(new Set()); setUnknown(new Set()); }

  if (view === "list") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
          <button onClick={() => setView("card")} className="flex items-center gap-1 text-sm text-[#1A3FAA] hover:underline transition font-semibold">
            <ChevronLeft className="w-4 h-4" /> 카드로
          </button>
          <span className="text-sm text-[#8B96B0]">{cards.length}개</span>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 pb-6">
          {cards.map((c, i) => (
            <button key={i} onClick={() => { setIndex(i); setFlipped(false); setView("card"); }}
              className={`w-full text-left p-3 rounded-xl border transition ${
                known.has(i) ? "border-green-300 bg-green-50" :
                unknown.has(i) ? "border-red-300 bg-red-50" :
                "border-[#D1D9F0] bg-white hover:border-[#1A3FAA] hover:bg-[#F5F8FF]"
              }`}>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#8B96B0] w-5 shrink-0">{i + 1}</span>
                <span className="text-base text-[#1A2050] flex-1">{c.front}</span>
                {known.has(i) && <Check className="w-4 h-4 text-green-500 shrink-0" />}
                {unknown.has(i) && <X className="w-4 h-4 text-red-500 shrink-0" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#8B96B0] hover:text-[#1A3FAA] transition font-medium">
          <ChevronLeft className="w-4 h-4" /> 목록
        </button>
        <h2 className="text-base font-bold text-[#0F1729] truncate mx-2">{set.title}</h2>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="text-[#8B96B0] hover:text-[#1A3FAA] transition"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={() => setView("list")} className="text-[#8B96B0] hover:text-[#1A3FAA] transition"><LayoutGrid className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {card && (
          <div className="flex flex-col items-center gap-4 py-2 pb-8">
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-2 bg-[#D1D9F0] rounded-full overflow-hidden">
                <div className="h-full bg-[#1A3FAA] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-sm text-[#8B96B0] shrink-0">{index + 1} / {cards.length}</span>
            </div>

            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="text-red-500">✕ 모르겠어요 {unknown.size}</span>
              <span className="text-[#D1D9F0]">|</span>
              <span className="text-green-600">알고있어요 ✓ {known.size}</span>
            </div>

            {/* Card flip */}
            <button onClick={() => setFlipped((f) => !f)} className="w-full max-w-md h-56" style={{ perspective: "1000px" }}>
              <div className="relative w-full h-full transition-transform duration-500"
                style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                {/* Front */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white border-2 border-[#D1D9F0] rounded-2xl shadow-md" style={{ backfaceVisibility: "hidden" }}>
                  <p className="text-xl font-bold text-[#0F1729] text-center leading-snug">{card.front}</p>
                  {card.sourcePage && <p className="text-sm text-[#8B96B0] mt-3">p.{card.sourcePage}</p>}
                  <p className="text-sm text-[#B0BAD0] mt-4">탭하여 정답보기</p>
                </div>
                {/* Back */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#EEF2FF] border-2 border-[#1A3FAA] rounded-2xl shadow-md"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                  <p className="text-sm text-[#1A3FAA] font-bold mb-3 uppercase tracking-wide">정답</p>
                  <p className="text-base text-[#1A2050] text-center leading-relaxed">{card.back}</p>
                </div>
              </div>
            </button>

            <div className="flex w-full max-w-md gap-3">
              <button onClick={markUnknown}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-base font-semibold transition ${
                  unknown.has(index) ? "bg-red-100 border-red-400 text-red-600" : "bg-white border-[#D1D9F0] text-[#5B6887] hover:border-red-300 hover:text-red-500"}`}>
                <X className="w-4 h-4" /> 모르겠어요
              </button>
              <button onClick={markKnown}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-base font-semibold transition ${
                  known.has(index) ? "bg-green-100 border-green-400 text-green-600" : "bg-white border-[#D1D9F0] text-[#5B6887] hover:border-green-300 hover:text-green-600"}`}>
                알고있어요 <Check className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={prev} disabled={index === 0} className="p-2 rounded-lg bg-[#EEF2FF] hover:bg-[#D1D9F0] disabled:opacity-30 transition text-[#1A3FAA] border border-[#A8B8E8]"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={reset} className="p-2 rounded-lg bg-[#F0F4FF] hover:bg-[#D1D9F0] transition text-[#8B96B0]"><RotateCcw className="w-4 h-4" /></button>
              <button onClick={next} disabled={index === cards.length - 1} className="p-2 rounded-lg bg-[#EEF2FF] hover:bg-[#D1D9F0] disabled:opacity-30 transition text-[#1A3FAA] border border-[#A8B8E8]"><ChevronRight className="w-5 h-5" /></button>
            </div>

            {known.size + unknown.size === cards.length && cards.length > 0 && (
              <div className="w-full max-w-md p-4 bg-[#EEF2FF] border border-[#A8B8E8] rounded-xl text-center">
                <p className="text-base text-[#0F1729] font-bold mb-1">학습 완료!</p>
                <p className="text-sm text-[#5B6887]">알고있어요 {known.size}개 · 모르겠어요 {unknown.size}개</p>
                {unknown.size > 0 && (
                  <button onClick={() => { setIndex([...unknown][0]); setFlipped(false); }}
                    className="mt-3 text-sm text-[#1A3FAA] font-semibold hover:underline transition">
                    모르는 카드 다시 보기 →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main FlashcardsTab ─────────────────────────────────────────────────────
export default function FlashcardsTab({ documentId }: { documentId: string }) {
  const [sets, setSets] = useState<FlashcardSetMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<"all" | "range">("all");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [activeSet, setActiveSet] = useState<FlashcardSetDetail | null>(null);
  const [loadingSet, setLoadingSet] = useState(false);

  const fetchSets = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/ai/${documentId}/flashcard-sets`);
      setSets(res.data ?? []);
    } catch { setSets([]); }
    setLoading(false);
  }, [documentId]);

  useEffect(() => { fetchSets(); }, [fetchSets]);


  async function createSet() {
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {};
      if (mode === "range" && rangeFrom && rangeTo) {
        payload.pageFrom = Number(rangeFrom);
        payload.pageTo = Number(rangeTo);
      }
      const res = await apiClient.post(`/api/ai/${documentId}/flashcard-sets`, payload);
      const created = res.data;
      setActiveSet({ id: created.id, title: created.title, flashcards: created.flashcards });
      setSets((prev) => [{ id: created.id, title: created.title, config_json: {}, created_at: created.created_at }, ...prev]);
      setShowForm(false);
    } catch {
    } finally {
      setCreating(false);
    }
  }

  async function openSet(meta: FlashcardSetMeta) {
    setLoadingSet(true);
    try {
      const res = await apiClient.get(`/api/ai/flashcard-sets/${meta.id}`);
      setActiveSet({ id: res.data.id, title: res.data.title, flashcards: res.data.flashcards });
    } catch {
    } finally {
      setLoadingSet(false);
    }
  }

  if (activeSet) {
    return <FlashcardPlayer set={activeSet} onBack={() => setActiveSet(null)} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
        <h2 className="text-base font-bold text-[#0F1729]">플래시카드</h2>
        <button onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 text-sm text-[#1A3FAA] font-semibold border border-[#A8B8E8] bg-[#EEF2FF] hover:bg-[#D1D9F0] rounded-lg px-3 py-1.5 transition">
          <Plus className="w-3.5 h-3.5" /> 새 세트
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {showForm && (
          <div className="mb-4 p-4 bg-white border border-[#D1D9F0] rounded-xl space-y-4 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setMode("all")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition ${mode === "all" ? "border-[#1A3FAA] bg-[#EEF2FF]" : "border-[#D1D9F0] bg-[#F0F4FF] hover:bg-[#EEF2FF]"}`}>
                <BookOpen className="w-4 h-4 text-[#1A3FAA]" />
                <p className="text-sm font-semibold text-[#1A3FAA]">전체</p>
              </button>
              <button onClick={() => setMode("range")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition ${mode === "range" ? "border-purple-400 bg-purple-50" : "border-[#D1D9F0] bg-[#F0F4FF] hover:bg-purple-50"}`}>
                <ScanText className="w-4 h-4 text-purple-600" />
                <p className="text-sm font-semibold text-purple-600">페이지 범위</p>
              </button>
            </div>
            {mode === "range" && (
              <div className="flex items-center gap-2">
                <input type="number" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} placeholder="시작"
                  className="flex-1 bg-[#F0F4FF] border border-[#D1D9F0] rounded-xl px-3 py-2.5 text-base text-[#0F1729] placeholder-[#B0BAD0] focus:outline-none focus:border-[#1A3FAA]" />
                <span className="text-[#8B96B0] text-base">~</span>
                <input type="number" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} placeholder="끝"
                  className="flex-1 bg-[#F0F4FF] border border-[#D1D9F0] rounded-xl px-3 py-2.5 text-base text-[#0F1729] placeholder-[#B0BAD0] focus:outline-none focus:border-[#1A3FAA]" />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-[#F0F4FF] text-[#5B6887] text-sm font-semibold hover:bg-[#D1D9F0] transition border border-[#D1D9F0]">취소</button>
              <button onClick={createSet} disabled={creating || (mode === "range" && (!rangeFrom || !rangeTo))}
                className="flex-1 py-2.5 rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] disabled:opacity-40 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-md shadow-blue-200">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                {creating ? "생성 중..." : "생성"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-[#8B96B0]" />
          </div>
        ) : loadingSet ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#1A3FAA]" />
            <p className="text-sm text-[#8B96B0]">불러오는 중...</p>
          </div>
        ) : sets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-5">
            <img src="/chacha.webp" alt="차차" className="w-14 h-14 object-contain opacity-40" />
            <p className="text-[#5B6887] text-base">생성된 플래시카드 세트가 없습니다.</p>
            <button onClick={() => setShowForm(true)}
              className="px-5 py-2.5 rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] text-white text-base font-semibold transition shadow-md shadow-blue-200">
              세트 만들기
            </button>
          </div>
        ) : (
          <div className="space-y-2 pb-6">
            {sets.map((s) => (
              <button key={s.id} onClick={() => openSet(s)}
                className="w-full text-left bg-white hover:bg-[#F5F8FF] border border-[#D1D9F0] hover:border-[#1A3FAA] rounded-xl p-4 transition shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-[#0F1729]">{s.title}</p>
                  <ChevronRight className="w-4 h-4 text-[#8B96B0]" />
                </div>
                <p className="text-sm text-[#8B96B0] mt-1">
                  {new Date(s.created_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
