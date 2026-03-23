"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Layers,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aiApi } from "@/lib/api/ai.api";
import { useApiKeyStore, AI_MODELS } from "@/lib/stores/apiKeyStore";
import type { FlashcardItem } from "@/types/study.types";

export default function FlashcardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const documentId = Number(id);
  const { model, isConfigured } = useApiKeyStore();

  const [selectedModel, setSelectedModel] = useState(model);
  const [count, setCount] = useState("10");
  const [cards, setCards] = useState<FlashcardItem[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [seenCards, setSeenCards] = useState<Set<number>>(new Set());

  const generateMutation = useMutation({
    mutationFn: () =>
      aiApi.generateFlashcard(documentId, Number(count), selectedModel),
    onSuccess: (data) => {
      setCards(data.flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSeenCards(new Set());
      toast.success("플래시카드가 생성되었습니다");
    },
    onError: () => {
      toast.error("플래시카드 생성에 실패했습니다. API 키를 확인해주세요.");
    },
  });

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
    setSeenCards((prev) => new Set(prev).add(currentIndex));
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (cards && currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handleReset = () => {
    setCards(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSeenCards(new Set());
  };

  const allSeen = cards ? seenCards.size >= cards.length : false;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        href={`/study/${documentId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        학습 모드로 돌아가기
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
          <Layers className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">플래시카드</h1>
          <p className="text-sm text-muted-foreground">
            카드를 뒤집어 핵심 개념을 암기하세요
          </p>
        </div>
      </div>

      {!cards ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">플래시카드 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConfigured() && (
              <p className="text-sm text-amber-600">
                설정 페이지에서 API 키를 먼저 등록해주세요
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>카드 수</Label>
                <Select value={count} onValueChange={(v) => v !== null && setCount(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}장
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>AI 모델</Label>
                <Select value={selectedModel} onValueChange={(v) => v !== null && setSelectedModel(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || !isConfigured()}
              className="w-full"
            >
              {generateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Layers className="w-4 h-4" />
              )}
              플래시카드 생성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 진행 상태 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {currentIndex + 1} / {cards.length}
            </span>
            <span className="text-muted-foreground">
              학습 완료: {seenCards.size} / {cards.length}
            </span>
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all"
              style={{
                width: `${((currentIndex + 1) / cards.length) * 100}%`,
              }}
            />
          </div>

          {/* 카드 */}
          <div
            className="perspective-1000 cursor-pointer"
            onClick={handleFlip}
          >
            <div
              className={`relative w-full min-h-[240px] transition-transform duration-500 transform-style-3d ${
                isFlipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              {/* 앞면 */}
              <Card className="absolute inset-0 backface-hidden flex items-center justify-center">
                <CardContent className="text-center p-8">
                  <p className="text-xs text-muted-foreground mb-3">질문</p>
                  <p className="text-lg font-medium leading-relaxed">
                    {cards[currentIndex].front}
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    클릭하여 답 확인
                  </p>
                </CardContent>
              </Card>

              {/* 뒷면 */}
              <Card className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] flex items-center justify-center bg-purple-50">
                <CardContent className="text-center p-8">
                  <p className="text-xs text-purple-600 mb-3">답</p>
                  <p className="text-lg font-medium leading-relaxed">
                    {cards[currentIndex].back}
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    클릭하여 질문으로 돌아가기
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 네비게이션 */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </Button>

            {allSeen ? (
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="w-4 h-4" />
                다시 학습
              </Button>
            ) : null}

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === cards.length - 1}
            >
              다음
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {allSeen && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="py-4 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">
                  모든 카드를 학습했습니다!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  다시 학습하거나 다른 학습 모드를 시도해보세요
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
