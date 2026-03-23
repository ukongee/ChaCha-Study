"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Brain, Loader2, Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aiApi } from "@/lib/api/ai.api";
import { useApiKeyStore, AI_MODELS } from "@/lib/stores/apiKeyStore";
import type { SummaryResponse } from "@/types/study.types";

export default function SummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const documentId = Number(id);
  const { model, isConfigured } = useApiKeyStore();
  const [selectedModel, setSelectedModel] = useState(model);

  const {
    data: summary,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["summary", documentId],
    queryFn: () => aiApi.getSummary(documentId),
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: () => aiApi.generateSummary(documentId, selectedModel),
    onSuccess: () => {
      refetch();
      toast.success("요약이 생성되었습니다");
    },
    onError: () => {
      toast.error("요약 생성에 실패했습니다. API 키를 확인해주세요.");
    },
  });

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
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <Brain className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI 요약</h1>
          <p className="text-sm text-muted-foreground">
            문서의 핵심 내용을 AI가 요약합니다
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : summary ? (
        <SummaryDisplay summary={summary} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <Sparkles className="w-10 h-10 mx-auto text-gray-300" />
            <div>
              <p className="font-medium text-gray-900">아직 요약이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                AI 모델을 선택하고 요약을 생성하세요
              </p>
            </div>

            {!isConfigured() && (
              <p className="text-sm text-amber-600">
                설정 페이지에서 API 키를 먼저 등록해주세요
              </p>
            )}

            <div className="flex items-center gap-2 justify-center">
              <Select value={selectedModel} onValueChange={(v) => v !== null && setSelectedModel(v)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="모델 선택" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || !isConfigured()}
              >
                {generateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                요약 생성
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryDisplay({ summary }: { summary: SummaryResponse }) {
  return (
    <div className="space-y-4">
      {/* 간단 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">핵심 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {summary.briefSummary}
          </p>
        </CardContent>
      </Card>

      {/* 키워드 */}
      {summary.keywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">주요 키워드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.keywords.map((keyword, i) => (
                <Badge key={i} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 중요 포인트 */}
      {summary.importantPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">중요 포인트</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.importantPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-blue-600 font-medium shrink-0">
                    {i + 1}.
                  </span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 상세 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">상세 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {summary.detailedSummary}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
