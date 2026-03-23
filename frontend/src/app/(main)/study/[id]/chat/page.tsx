"use client";

import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, MessageCircle, Send, Loader2, Bot, User } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { aiApi } from "@/lib/api/ai.api";
import { useApiKeyStore } from "@/lib/stores/apiKeyStore";
import type { ChatMessage } from "@/types/study.types";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const documentId = Number(id);
  const { model, isConfigured } = useApiKeyStore();
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat", documentId],
    queryFn: () => aiApi.getChatHistory(documentId),
  });

  const sendMutation = useMutation({
    mutationFn: (question: string) =>
      aiApi.sendChat(documentId, question, model),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", documentId] });
    },
    onError: () => {
      toast.error("메시지 전송에 실패했습니다. API 키를 확인해주세요.");
    },
  });

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!isConfigured()) {
      toast.error("설정 페이지에서 API 키를 먼저 등록해주세요");
      return;
    }
    setInput("");
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMutation.isPending]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="space-y-4 mb-4">
        <Link
          href={`/study/${documentId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          학습 모드로 돌아가기
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI 채팅</h1>
            <p className="text-sm text-muted-foreground">
              문서 내용에 대해 질문하세요
            </p>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <Skeleton className="h-16 flex-1" />
                </div>
              ))}
            </div>
          ) : !messages?.length && !sendMutation.isPending ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm text-muted-foreground">
                문서 내용에 대해 궁금한 것을 질문해보세요
              </p>
            </div>
          ) : (
            <>
              {messages?.map((msg: ChatMessage) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {sendMutation.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* 입력 영역 */}
      <div className="mt-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="질문을 입력하세요..."
          disabled={sendMutation.isPending}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={sendMutation.isPending || !input.trim()}
          size="icon"
        >
          {sendMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-gray-200" : "bg-blue-100"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-gray-600" />
        ) : (
          <Bot className="w-4 h-4 text-blue-600" />
        )}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-gray-100 text-gray-900 rounded-tl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
