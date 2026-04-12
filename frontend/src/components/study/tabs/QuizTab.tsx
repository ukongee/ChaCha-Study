"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "@/lib/api/client";
import type { QuizItem, Difficulty } from "@/types/study.types";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Lightbulb, RotateCcw, Plus, Loader2 } from "lucide-react";

interface QuizSetMeta {
  id: string;
  title: string;
  config_json: { count: number; difficulty: string };
  created_at: string;
}

interface QuizSetDetail {
  id: string;
  title: string;
  quizzes: QuizItem[];
}

const LABELS = ["A", "B", "C", "D", "E"];

// ── Quiz player ────────────────────────────────────────────────────────────
function QuizPlayer({ set, onBack }: { set: QuizSetDetail; onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [answered, setAnswered] = useState<Record<number, "correct" | "wrong">>({});

  const quizzes = set.quizzes;
  const q: QuizItem | undefined = quizzes[index];
  const progress = quizzes.length > 0 ? ((index + 1) / quizzes.length) * 100 : 0;
  const allDone = quizzes.length > 0 && Object.keys(answered).length === quizzes.length;
  const hint = q?.explanation?.split(/[.。]/)[0] ?? "";

  function choose(opt: string) {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
    setShowHint(false);
    const isCorrect = opt === q?.answer;
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), wrong: s.wrong + (isCorrect ? 0 : 1) }));
    setAnswered((a) => ({ ...a, [index]: isCorrect ? "correct" : "wrong" }));
  }

  function goNext() {
    setIndex((i) => Math.min(quizzes.length - 1, i + 1));
    setSelected(null); setRevealed(false); setShowHint(false);
  }

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
    setSelected(answered[index - 1] !== undefined ? (quizzes[index - 1]?.answer ?? null) : null);
    setRevealed(answered[index - 1] !== undefined);
    setShowHint(false);
  }

  function restart() {
    setIndex(0); setSelected(null); setRevealed(false);
    setShowHint(false); setScore({ correct: 0, wrong: 0 }); setAnswered({});
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#8B96B0] hover:text-[#1A3FAA] transition font-medium">
          <ChevronLeft className="w-4 h-4" /> 목록
        </button>
        <h2 className="text-base font-bold text-[#0F1729] truncate mx-2">{set.title}</h2>
        <button onClick={restart} className="text-[#8B96B0] hover:text-[#1A3FAA] transition">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {q && (
          <div className="flex flex-col gap-4 pb-8">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-[#D1D9F0] rounded-full overflow-hidden">
                <div className="h-full bg-[#1A3FAA] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-sm text-[#8B96B0] shrink-0">{index + 1} / {quizzes.length}</span>
            </div>

            <div className="flex gap-4 text-sm font-medium">
              <span className="text-green-600">✓ 정답 {score.correct}</span>
              <span className="text-red-500">✕ 오답 {score.wrong}</span>
            </div>

            <div className="bg-white border border-[#D1D9F0] rounded-xl p-4 shadow-sm">
              <p className="text-sm text-[#8B96B0] mb-2">Q{index + 1}{q.sourcePage ? ` · p.${q.sourcePage}` : ""}</p>
              <p className="text-base text-[#0F1729] font-semibold leading-relaxed">{q.question}</p>
            </div>

            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const label = LABELS[oi] ?? String(oi + 1);
                const isCorrect = opt === q.answer;
                const isSelected = opt === selected;
                let cls = "w-full text-left px-4 py-3 rounded-xl border transition flex items-center gap-3 text-base font-medium ";
                if (!revealed) cls += "border-[#D1D9F0] text-[#3B4A6B] hover:border-[#1A3FAA] hover:bg-[#EEF2FF] hover:text-[#1A3FAA] bg-white";
                else if (isCorrect) cls += "border-green-400 bg-green-50 text-green-700";
                else if (isSelected) cls += "border-red-400 bg-red-50 text-red-600";
                else cls += "border-[#D1D9F0] bg-[#F5F8FF] text-[#8B96B0]";
                return (
                  <button key={oi} className={cls} onClick={() => choose(opt)}>
                    <span className="w-5 text-sm font-bold shrink-0 opacity-60">{label}.</span>
                    <span className="flex-1">{opt}</span>
                    {revealed && isCorrect && <CheckCircle className="w-5 h-5 shrink-0 text-green-500" />}
                    {revealed && isSelected && !isCorrect && <XCircle className="w-5 h-5 shrink-0 text-red-500" />}
                  </button>
                );
              })}
            </div>

            {!revealed && (
              <button onClick={() => setShowHint((s) => !s)} className="flex items-center gap-1.5 text-sm text-[#8B96B0] hover:text-amber-600 transition font-medium self-start">
                <Lightbulb className="w-4 h-4" /> 힌트 보기
              </button>
            )}
            {showHint && hint && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-700">💡 {hint}</p>
              </div>
            )}

            {revealed && (
              <div className="p-4 rounded-xl bg-[#F5F8FF] border border-[#D1D9F0]">
                <p className="text-sm text-[#5B6887] font-semibold mb-1">해설</p>
                <p className="text-base text-[#1A2050] leading-relaxed">{q.explanation}</p>
              </div>
            )}

            <div className="flex items-center justify-between mt-1">
              <button onClick={goPrev} disabled={index === 0} className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-[#EEF2FF] hover:bg-[#D1D9F0] disabled:opacity-30 text-[#1A3FAA] text-sm font-semibold transition border border-[#A8B8E8]">
                <ChevronLeft className="w-4 h-4" /> 이전
              </button>
              {index < quizzes.length - 1 ? (
                <button onClick={goNext} className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] text-white text-sm font-semibold transition shadow-md shadow-blue-200">
                  다음 <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={restart} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EEF2FF] hover:bg-[#D1D9F0] text-[#1A3FAA] text-sm font-semibold transition border border-[#A8B8E8]">
                  <RotateCcw className="w-4 h-4" /> 다시 풀기
                </button>
              )}
            </div>

            {allDone && index === quizzes.length - 1 && (
              <div className="p-4 bg-[#EEF2FF] border border-[#A8B8E8] rounded-xl text-center">
                <p className="text-base text-[#0F1729] font-bold mb-1">퀴즈 완료!</p>
                <p className="text-sm text-[#5B6887]">
                  정답 {score.correct}개 / {quizzes.length}문제 ({Math.round((score.correct / quizzes.length) * 100)}%)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main QuizTab ───────────────────────────────────────────────────────────
export default function QuizTab({ documentId, autoGenerate }: { documentId: string; autoGenerate?: boolean }) {
  const [sets, setSets] = useState<QuizSetMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [activeSet, setActiveSet] = useState<QuizSetDetail | null>(null);
  const [loadingSet, setLoadingSet] = useState(false);
  const autoTriggered = useRef(false);

  const fetchSets = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/ai/${documentId}/quiz-sets`);
      setSets(res.data ?? []);
    } catch { setSets([]); }
    setLoading(false);
  }, [documentId]);

  useEffect(() => { fetchSets(); }, [fetchSets]);

  useEffect(() => {
    if (!loading && sets.length === 0 && autoGenerate && !creating && !autoTriggered.current) {
      autoTriggered.current = true;
      createSet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, autoGenerate]);

  async function createSet() {
    setCreating(true);
    try {
      const res = await apiClient.post(`/api/ai/${documentId}/quiz-sets`, { count, difficulty });
      const created = res.data;
      setActiveSet({ id: created.id, title: created.title, quizzes: created.quizzes });
      setSets((prev) => [{ id: created.id, title: created.title, config_json: { count, difficulty }, created_at: created.created_at }, ...prev]);
      setShowForm(false);
    } catch {
    } finally {
      setCreating(false);
    }
  }

  async function openSet(meta: QuizSetMeta) {
    setLoadingSet(true);
    try {
      const res = await apiClient.get(`/api/ai/quiz-sets/${meta.id}`);
      setActiveSet({ id: res.data.id, title: res.data.title, quizzes: res.data.quizzes });
    } catch {
    } finally {
      setLoadingSet(false);
    }
  }

  if (activeSet) {
    return <QuizPlayer set={activeSet} onBack={() => setActiveSet(null)} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
        <h2 className="text-base font-bold text-[#0F1729]">퀴즈</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 text-sm text-[#1A3FAA] font-semibold border border-[#A8B8E8] bg-[#EEF2FF] hover:bg-[#D1D9F0] rounded-lg px-3 py-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" /> 새 퀴즈
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Creation form */}
        {showForm && (
          <div className="mb-4 p-4 bg-white border border-[#D1D9F0] rounded-xl space-y-4 shadow-sm">
            <div>
              <p className="text-sm text-[#5B6887] font-semibold mb-2">문제 수</p>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((n) => (
                  <button key={n} onClick={() => setCount(n)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${count === n ? "bg-[#1A3FAA] border-[#1A3FAA] text-white shadow-sm" : "bg-[#F0F4FF] border-[#D1D9F0] text-[#5B6887] hover:border-[#1A3FAA] hover:text-[#1A3FAA]"}`}>
                    {n}문제
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-[#5B6887] font-semibold mb-2">난이도</p>
              <div className="flex gap-2">
                {(["EASY", "MEDIUM", "HARD"] as Difficulty[]).map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${difficulty === d ? "bg-[#1A3FAA] border-[#1A3FAA] text-white shadow-sm" : "bg-[#F0F4FF] border-[#D1D9F0] text-[#5B6887] hover:border-[#1A3FAA] hover:text-[#1A3FAA]"}`}>
                    {d === "EASY" ? "쉬움" : d === "MEDIUM" ? "보통" : "어려움"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-[#F0F4FF] text-[#5B6887] text-sm font-semibold hover:bg-[#D1D9F0] transition border border-[#D1D9F0]">취소</button>
              <button onClick={createSet} disabled={creating}
                className="flex-1 py-2.5 rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] disabled:opacity-40 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-md shadow-blue-200">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                {creating ? "생성 중..." : "생성"}
              </button>
            </div>
          </div>
        )}

        {/* Set list */}
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
            <p className="text-[#5B6887] text-base">생성된 퀴즈 세트가 없습니다.</p>
            <button onClick={() => setShowForm(true)}
              className="px-5 py-2.5 rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] text-white text-base font-semibold transition shadow-md shadow-blue-200">
              퀴즈 만들기
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
