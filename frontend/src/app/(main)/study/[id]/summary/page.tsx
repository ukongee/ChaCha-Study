"use client";

import { use, useState, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Brain, Loader2, Sparkles, FileText, MessageSquare, Languages } from "lucide-react";

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
import type { SummaryResponse, TranslationResponse } from "@/types/study.types";

export default function SummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const documentId = Number(id);
  const { model, isConfigured } = useApiKeyStore();
  const [selectedModel, setSelectedModel] = useState(model);
  const [activePage, setActivePage] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"original" | "translated">("original");
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const { data: translation, isLoading: isTranslationLoading, refetch: refetchTranslation } = useQuery({
    queryKey: ["translation", documentId],
    queryFn: () => aiApi.getTranslation(documentId),
    retry: false,
    enabled: false,
  });

  const translateMutation = useMutation({
    mutationFn: () => aiApi.generateTranslation(documentId, selectedModel),
    onSuccess: () => {
      refetchTranslation();
      toast.success("번역이 완료되었습니다");
    },
    onError: () => {
      toast.error("번역에 실패했습니다. API 키를 확인해주세요.");
    },
  });

  const handleTranslateToggle = () => {
    if (viewMode === "original") {
      setViewMode("translated");
      if (!translation) {
        refetchTranslation().then((result) => {
          if (!result.data) {
            translateMutation.mutate();
          }
        });
      }
    } else {
      setViewMode("original");
    }
  };

  const jumpToPage = (page: number) => {
    setActivePage(page);
    if (iframeRef.current) {
      iframeRef.current.src = `/api/documents/${documentId}/file#page=${page}`;
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white shrink-0">
        <Link
          href={`/study/${documentId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          학습 모드
        </Link>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">AI 요약</span>
        </div>
        <Link href={`/study/${documentId}/chat`}>
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4" />
            AI 질문하기
          </Button>
        </Link>
      </div>

      {/* Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽: 문서 뷰어 */}
        <div className="w-1/2 border-r bg-gray-50 flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2 border-b bg-white">
            <FileText className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">원본 문서</span>
            {activePage && (
              <Badge variant="secondary" className="text-xs">
                {activePage}p
              </Badge>
            )}
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={handleTranslateToggle}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
                  ${viewMode === "translated"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {(translateMutation.isPending || isTranslationLoading) ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Languages className="w-3 h-3" />
                )}
                {viewMode === "translated" ? "원본 보기" : "번역 보기"}
              </button>
            </div>
          </div>

          {viewMode === "original" ? (
            <iframe
              ref={iframeRef}
              src={`/api/documents/${documentId}/file`}
              className="flex-1 w-full border-0"
              title="문서 뷰어"
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {translateMutation.isPending || isTranslationLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                    <p className="text-sm text-muted-foreground">번역 중...</p>
                  </div>
                </div>
              ) : translation?.pages?.length ? (
                translation.pages
                  .filter(p => p.page === (activePage ?? p.page) || !activePage)
                  .map((p) => (
                    <div
                      key={p.page}
                      className={`rounded-lg border p-3 text-sm leading-relaxed cursor-pointer transition-colors
                        ${activePage === p.page ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                      onClick={() => jumpToPage(p.page)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{p.page}p</Badge>
                      </div>
                      <p className="whitespace-pre-wrap text-gray-700">{p.text}</p>
                    </div>
                  ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">번역 데이터가 없습니다</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 오른쪽: 요약 패널 */}
        <div className="w-1/2 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : summary ? (
            <SummaryDisplay
              summary={summary}
              onKeywordClick={jumpToPage}
              activePage={activePage}
            />
          ) : (
            <div className="p-4">
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
                    <Select
                      value={selectedModel}
                      onValueChange={(v) => v !== null && setSelectedModel(v)}
                    >
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryDisplay({
  summary,
  onKeywordClick,
  activePage,
}: {
  summary: SummaryResponse;
  onKeywordClick: (page: number) => void;
  activePage: number | null;
}) {
  return (
    <div className="p-4 space-y-4">
      {/* 핵심 요약 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">핵심 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {summary.briefSummary}
          </p>
        </CardContent>
      </Card>

      {/* 키워드 - 클릭 시 PDF 페이지 이동 */}
      {summary.keywords && summary.keywords.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">핵심 키워드</CardTitle>
            <p className="text-xs text-muted-foreground">클릭하면 해당 페이지로 이동합니다</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.keywords.map((keyword, i) => {
                const kw = typeof keyword === "string"
                  ? { text: keyword, page: null }
                  : keyword;
                const isActive = activePage !== null && kw.page === activePage;
                return (
                  <button
                    key={i}
                    onClick={() => kw.page && onKeywordClick(kw.page)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors
                      ${kw.page
                        ? isActive
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                        : "bg-gray-100 text-gray-600 cursor-default"
                      }`}
                  >
                    {kw.text}
                    {kw.page && (
                      <span className={`text-[10px] ${isActive ? "text-blue-200" : "text-blue-400"}`}>
                        p.{kw.page}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 중요 포인트 */}
      {summary.importantPoints && summary.importantPoints.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">중요 포인트</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.importantPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-blue-600 font-bold shrink-0">{i + 1}.</span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 페이지별 요약 */}
      {summary.pageSummaries && summary.pageSummaries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 px-1">페이지별 요약</h3>
          {summary.pageSummaries.map((ps, i) => (
            <button
              key={i}
              onClick={() => ps.page && onKeywordClick(ps.page)}
              className={`w-full text-left rounded-lg border p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/50
                ${activePage === ps.page ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs shrink-0">
                  {ps.page}p
                </Badge>
                <span className="text-sm font-medium text-gray-900 line-clamp-1">
                  {ps.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {ps.summary}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* 상세 요약 */}
      {summary.detailedSummary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">상세 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {summary.detailedSummary}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
