"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  HelpCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { aiApi } from "@/lib/api/ai.api";
import { useApiKeyStore, AI_MODELS } from "@/lib/stores/apiKeyStore";
import type { QuizItem, Difficulty } from "@/types/study.types";

export default function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const documentId = Number(id);
  const { model, isConfigured } = useApiKeyStore();

  const [selectedModel, setSelectedModel] = useState(model);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [count, setCount] = useState("10");
  const [quizzes, setQuizzes] = useState<QuizItem[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () =>
      aiApi.generateQuiz(documentId, difficulty, Number(count), selectedModel),
    onSuccess: (data) => {
      setQuizzes(data.quizzes);
      setAnswers({});
      setSubmitted(false);
      toast.success("퀴즈가 생성되었습니다");
    },
    onError: () => {
      toast.error("퀴즈 생성에 실패했습니다. API 키를 확인해주세요.");
    },
  });

  const handleAnswer = (qIndex: number, option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = () => {
    if (!quizzes) return;
    if (Object.keys(answers).length < quizzes.length) {
      toast.error("모든 문제에 답을 선택해주세요");
      return;
    }
    setSubmitted(true);
  };

  const score = quizzes
    ? quizzes.filter((q, i) => answers[i] === q.answer).length
    : 0;

  const handleReset = () => {
    setQuizzes(null);
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        href={`/study/${documentId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        학습 모드로 돌아가기
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI 퀴즈</h1>
          <p className="text-sm text-muted-foreground">
            문서 내용을 바탕으로 퀴즈를 풀어보세요
          </p>
        </div>
      </div>

      {!quizzes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">퀴즈 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConfigured() && (
              <p className="text-sm text-amber-600">
                설정 페이지에서 API 키를 먼저 등록해주세요
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>난이도</Label>
                <Select
                  value={difficulty}
                  onValueChange={(v) => v !== null && setDifficulty(v as Difficulty)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">쉬움</SelectItem>
                    <SelectItem value="MEDIUM">보통</SelectItem>
                    <SelectItem value="HARD">어려움</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>문제 수</Label>
                <Select value={count} onValueChange={(v) => v !== null && setCount(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}문제
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
                <HelpCircle className="w-4 h-4" />
              )}
              퀴즈 생성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 결과 표시 */}
          {submitted && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {score}/{quizzes.length} 정답
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {score === quizzes.length
                      ? "완벽합니다!"
                      : score >= quizzes.length * 0.7
                        ? "잘했어요!"
                        : "다시 도전해보세요!"}
                  </p>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" />
                  다시 풀기
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 퀴즈 문제들 */}
          <div className="space-y-4">
            {quizzes.map((quiz, qIndex) => (
              <Card key={qIndex}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge variant="secondary">{qIndex + 1}</Badge>
                    {quiz.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quiz.options.map((option, oIndex) => {
                    const isSelected = answers[qIndex] === option;
                    const isCorrect = quiz.answer === option;
                    let optionClass =
                      "border rounded-lg px-4 py-3 text-sm cursor-pointer transition-all ";

                    if (submitted) {
                      if (isCorrect) {
                        optionClass +=
                          "border-green-300 bg-green-50 text-green-800";
                      } else if (isSelected && !isCorrect) {
                        optionClass +=
                          "border-red-300 bg-red-50 text-red-800";
                      } else {
                        optionClass += "border-gray-200 text-gray-500";
                      }
                    } else {
                      optionClass += isSelected
                        ? "border-blue-300 bg-blue-50 text-blue-800"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
                    }

                    return (
                      <button
                        key={oIndex}
                        className={`${optionClass} w-full text-left flex items-center gap-2`}
                        onClick={() => handleAnswer(qIndex, option)}
                        disabled={submitted}
                      >
                        {submitted && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        )}
                        {submitted && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                        <span>{option}</span>
                      </button>
                    );
                  })}

                  {submitted && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600">해설</p>
                      <p className="text-sm text-gray-700 mt-1">
                        {quiz.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {!submitted && (
            <Button onClick={handleSubmit} className="w-full">
              제출하기
            </Button>
          )}
        </>
      )}
    </div>
  );
}
