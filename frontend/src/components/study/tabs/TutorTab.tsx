"use client";

import { useState, useEffect, useRef } from "react";
import apiClient from "@/lib/api/client";
import MarkdownText from "@/components/ui/MarkdownText";
import type { ChatMessage } from "@/types/study.types";
import { Send, Loader2, RefreshCw, BookOpen, Trash2 } from "lucide-react";

interface Props {
  documentId: string;
}

export default function TutorTab({ documentId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hasWiki, setHasWiki] = useState<boolean | null>(null);
  const [generatingWiki, setGeneratingWiki] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Wiki 존재 여부 및 대화 기록 로드
  useEffect(() => {
    Promise.all([
      apiClient
        .get(`/api/ai/${documentId}/wiki`)
        .then(() => setHasWiki(true))
        .catch(() => setHasWiki(false)),
      apiClient
        .get(`/api/ai/${documentId}/chat`)
        .then((res) => setMessages(res.data ?? []))
        .catch(() => {}),
    ]).finally(() => setLoadingHistory(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 새 메시지 도착 시 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function generateWiki(force = false) {
    setGeneratingWiki(true);
    try {
      await apiClient.post(`/api/ai/${documentId}/wiki`, { force });
      setHasWiki(true);
    } catch {
    } finally {
      setGeneratingWiki(false);
    }
  }

  async function sendMessage() {
    const question = input.trim();
    if (!question || sending) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setSending(true);

    // 낙관적 업데이트
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    try {
      const res = await apiClient.post(`/api/ai/${documentId}/chat`, { question });
      if (res.data?.needsWiki) setHasWiki(false);
      setMessages((prev) => [...prev, res.data]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "답변 생성에 실패했습니다. 다시 시도해주세요." },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function clearHistory() {
    try {
      await apiClient.delete(`/api/ai/${documentId}/chat`);
      setMessages([]);
    } catch {}
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  }

  // ── 로딩 중 ──────────────────────────────────────────────────────
  if (loadingHistory) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
          <h2 className="text-base font-bold text-[#0F1729]">AI Tutor</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <img src="/chacha.webp" alt="차차" className="w-16 h-16 object-contain animate-pulse" />
          <p className="text-[#5B6887] text-base font-medium">불러오는 중...</p>
        </div>
      </div>
    );
  }

  // ── Wiki 미생성 ───────────────────────────────────────────────────
  if (!hasWiki) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
          <h2 className="text-base font-bold text-[#0F1729]">AI Tutor</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
          <img src="/chacha.webp" alt="차차" className="w-16 h-16 object-contain opacity-50" />
          <div className="text-center">
            <p className="text-base font-bold text-[#0F1729] mb-1">Wiki 기반 AI 튜터</p>
            <p className="text-sm text-[#5B6887] leading-relaxed">
              강의자료를 기반으로 학습용 Wiki를 먼저 생성해야 합니다.
            </p>
            <p className="text-sm text-[#8B96B0] mt-1">
              Wiki 생성 후 자유롭게 질문하세요.
            </p>
          </div>

          <div className="w-full max-w-xs space-y-3">
            <div className="bg-[#EEF2FF] border border-[#A8B8E8] rounded-xl p-3 text-xs text-[#3B4A6B] leading-relaxed">
              <p className="font-semibold text-[#1A3FAA] mb-1.5">Wiki 기반 학습이란?</p>
              <ul className="space-y-1">
                <li>• 강의 핵심 개념을 섹션별로 구조화</li>
                <li>• 질문과 관련된 섹션만 선택하여 답변</li>
                <li>• 빠르고 일관된 학습 경험 제공</li>
              </ul>
            </div>

            <button
              onClick={() => generateWiki(false)}
              disabled={generatingWiki}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] disabled:opacity-60 text-white text-base font-semibold transition shadow-md shadow-blue-200"
            >
              {generatingWiki ? (
                <>
                  <img src="/chacha.webp" alt="차차" className="w-5 h-5 object-contain animate-pulse" />
                  Wiki 생성 중...
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  Wiki 생성하기
                </>
              )}
            </button>
            <p className="text-xs text-center text-[#8B96B0]">
              요약을 먼저 생성하면 더 정확한 Wiki가 만들어집니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── 채팅 UI ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[#0F1729]">AI Tutor</h2>
          <span className="text-xs px-2 py-0.5 rounded-md bg-green-100 text-green-600 border border-green-200 font-medium">
            Wiki 기반
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => generateWiki(true)}
            disabled={generatingWiki}
            className="flex items-center gap-1.5 text-sm text-[#8B96B0] hover:text-[#1A3FAA] disabled:opacity-40 transition font-medium"
            title="Wiki 재생성"
          >
            <RefreshCw className={`w-4 h-4 ${generatingWiki ? "animate-spin" : ""}`} />
            Wiki 재생성
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-[#8B96B0] hover:text-red-500 transition"
              title="대화 초기화"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Wiki 재생성 중 배너 */}
      {generatingWiki && (
        <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
          <img src="/chacha.webp" alt="차차" className="w-4 h-4 object-contain animate-pulse" />
          <p className="text-xs text-amber-700">Wiki를 재생성하는 중입니다...</p>
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center pb-8">
            <img src="/chacha.webp" alt="차차" className="w-14 h-14 object-contain opacity-60" />
            <div>
              <p className="text-base font-semibold text-[#0F1729] mb-1">무엇이든 물어보세요!</p>
              <p className="text-sm text-[#5B6887]">Wiki 내용을 기반으로 답변드립니다.</p>
            </div>
            <div className="w-full max-w-xs space-y-2 mt-2">
              {[
                "이 강의의 핵심 개념을 설명해줘",
                "시험에 자주 나오는 내용이 뭐야?",
                "헷갈리는 개념 차이를 정리해줘",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-[#EEF2FF] border border-[#A8B8E8] text-sm text-[#1A3FAA] hover:bg-[#D1D9F0] transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <img
                src="/chacha.webp"
                alt="차차"
                className="w-7 h-7 object-contain mr-2 mt-1 shrink-0"
              />
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-[#1A3FAA] text-white rounded-tr-sm shadow-md shadow-blue-200"
                  : "bg-white border border-[#D1D9F0] text-[#1A2050] rounded-tl-sm shadow-sm"
              }`}
            >
              {msg.role === "user" ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <MarkdownText content={msg.content} className="text-sm" />
              )}

              {/* 참고 섹션 */}
              {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#D1D9F0]">
                  <p className="text-xs text-[#8B96B0] font-medium mb-1">참고 섹션</p>
                  <div className="flex flex-wrap gap-1">
                    {msg.sources.map((s, j) => (
                      <span
                        key={j}
                        className="text-xs px-2 py-0.5 rounded bg-[#EEF2FF] text-[#1A3FAA] border border-[#A8B8E8]"
                      >
                        {s.sectionTitle ?? (s.page ? `p.${s.page}` : "참고")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 답변 생성 중 */}
        {sending && (
          <div className="flex justify-start">
            <img
              src="/chacha.webp"
              alt="차차"
              className="w-7 h-7 object-contain mr-2 mt-1 shrink-0 animate-pulse"
            />
            <div className="bg-white border border-[#D1D9F0] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#1A3FAA] animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div className="px-4 py-3 border-t border-[#D1D9F0] bg-white shrink-0">
        <div className="flex items-end gap-2 bg-[#F0F4FF] border border-[#D1D9F0] rounded-2xl px-3 py-2 focus-within:border-[#1A3FAA] transition">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="질문을 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)"
            rows={1}
            disabled={sending}
            className="flex-1 bg-transparent text-sm text-[#1A2050] placeholder-[#B0BAD0] resize-none focus:outline-none leading-relaxed"
            style={{ maxHeight: 120, overflowY: "auto" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] disabled:opacity-40 text-white transition shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-[#8B96B0] mt-1.5 text-center">
          Wiki 섹션을 분석하여 관련 내용으로 답변합니다
        </p>
      </div>
    </div>
  );
}
