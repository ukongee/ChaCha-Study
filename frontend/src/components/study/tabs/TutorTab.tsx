"use client";

import { useState, useEffect, useRef } from "react";
import apiClient from "@/lib/api/client";
import type { ChatMessage } from "@/types/study.types";
import { Send, Loader2, Trash2, BookOpen, AlertTriangle } from "lucide-react";

interface Props {
  documentId: string;
  embeddingStatus: string;
}

export default function TutorTab({ documentId, embeddingStatus }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient.get(`/api/ai/${documentId}/chat`)
      .then((res) => setMessages(res.data))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [documentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    const q = input.trim();
    if (!q || sending) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: q };
    setMessages((m) => [...m, userMsg]);
    setSending(true);

    try {
      const res = await apiClient.post(`/api/ai/${documentId}/chat`, { question: q });
      setMessages((m) => [...m, res.data]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function clearHistory() {
    if (!confirm("대화 기록을 모두 삭제하시겠습니까?")) return;
    await apiClient.delete(`/api/ai/${documentId}/chat`);
    setMessages([]);
  }

  const notReady = embeddingStatus !== "done";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#1A3FAA]" />
          <h2 className="text-base font-bold text-[#0F1729]">AI Tutor</h2>
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory} className="text-[#8B96B0] hover:text-red-500 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Not ready warning */}
      {notReady && (
        <div className="mx-5 mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            {embeddingStatus === "processing"
              ? "문서 인덱싱 중입니다. 완료 후 AI Tutor를 사용할 수 있습니다."
              : embeddingStatus === "failed"
              ? "인덱싱에 실패했습니다. 문서 목록에서 재시도해주세요."
              : "문서 인덱싱이 필요합니다."}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loadingHistory ? (
          <div className="flex justify-center pt-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#8B96B0]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
            <img src="/chacha.webp" alt="차차" className="w-12 h-12 object-contain opacity-40" />
            <p className="text-[#5B6887] text-base">강의자료에 대해 무엇이든 물어보세요.</p>
            <p className="text-[#8B96B0] text-sm">답변은 문서 내용에 근거합니다.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#1A3FAA] text-white rounded-br-sm shadow-md shadow-blue-200"
                    : "bg-white border border-[#D1D9F0] text-[#1A2050] rounded-bl-sm shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#D1D9F0] flex flex-wrap gap-1.5">
                    {msg.sources.map((s, si) => (
                      <span key={si} className="text-xs bg-[#EEF2FF] text-[#1A3FAA] px-2 py-0.5 rounded-md border border-[#A8B8E8]">
                        p.{s.page}
                        {s.sectionTitle ? ` · ${s.sectionTitle}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#D1D9F0] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#1A3FAA]/40 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#D1D9F0] bg-white shrink-0">
        <div className="flex items-end gap-2 bg-[#F0F4FF] border border-[#D1D9F0] rounded-xl px-4 py-2 focus-within:border-[#1A3FAA] focus-within:ring-2 focus-within:ring-[#1A3FAA]/10 transition">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={sending || notReady}
            placeholder={notReady ? "인덱싱 완료 후 사용 가능합니다" : "질문을 입력하세요... (Enter로 전송)"}
            rows={1}
            className="flex-1 resize-none bg-transparent text-base text-[#0F1729] placeholder-[#B0BAD0] focus:outline-none max-h-32"
            style={{ overflowY: "auto" }}
          />
          <button
            onClick={send}
            disabled={sending || !input.trim() || notReady}
            className="p-1.5 rounded-lg bg-[#1A3FAA] hover:bg-[#2B52CC] disabled:opacity-30 transition text-white shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
