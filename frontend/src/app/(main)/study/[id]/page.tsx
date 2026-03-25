"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Brain,
  HelpCircle,
  Layers,
  MessageCircle,
  ArrowLeft,
  Eye,
  Loader2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { documentsApi } from "@/lib/api/documents.api";
import { Button } from "@/components/ui/button";
import { format } from "@/lib/format";

const STUDY_MODES = [
  {
    key: "summary",
    label: "요약",
    description: "AI가 핵심 내용을 요약해줍니다",
    icon: Brain,
    color: "bg-blue-50 text-blue-600",
  },
  {
    key: "quiz",
    label: "퀴즈",
    description: "객관식 문제로 학습 내용을 확인하세요",
    icon: HelpCircle,
    color: "bg-green-50 text-green-600",
  },
  {
    key: "flashcard",
    label: "플래시카드",
    description: "카드를 뒤집으며 핵심 개념을 암기하세요",
    icon: Layers,
    color: "bg-purple-50 text-purple-600",
  },
  {
    key: "chat",
    label: "AI 채팅",
    description: "문서 내용에 대해 AI와 대화하세요",
    icon: MessageCircle,
    color: "bg-amber-50 text-amber-600",
  },
];

export default function StudyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const documentId = Number(id);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  const handleViewFile = async () => {
    if (blobUrl) {
      setBlobUrl(null);
      return;
    }
    setFileLoading(true);
    try {
      const url = await documentsApi.getFileBlobUrl(documentId);
      setBlobUrl(url);
    } catch {
      // 파일 없음
    } finally {
      setFileLoading(false);
    }
  };

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: documentsApi.getDocuments,
  });

  const doc = documents?.find((d) => d.id === documentId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-muted-foreground">문서를 찾을 수 없습니다</p>
        <Link href="/study">
          <Button variant="outline" className="mt-3">
            목록으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  const typeColor: Record<string, string> = {
    PDF: "bg-red-50 text-red-700",
    PPT: "bg-orange-50 text-orange-700",
    PPTX: "bg-orange-50 text-orange-700",
  };

  return (
    <div className="space-y-6">
      <Link
        href="/study"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        목록으로
      </Link>

      {/* 문서 정보 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate">
                {doc.originalFileName}
              </CardTitle>
              <CardDescription className="mt-1">
                {doc.pageCount}페이지 &middot;{" "}
                {format.fileSize(doc.fileSize)} &middot;{" "}
                {format.date(doc.createdAt)}
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className={typeColor[doc.fileType] ?? ""}
            >
              {doc.fileType}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* 학습 모드 선택 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          학습 모드 선택
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STUDY_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <Link key={mode.key} href={`/study/${doc.id}/${mode.key}`}>
                <Card className="hover:ring-2 hover:ring-blue-200 transition-all cursor-pointer h-full">
                  <CardContent className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${mode.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {mode.label}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mode.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 원본 파일 뷰어 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">원본 보기</h2>
          {doc.fileType === "PDF" && (
            <Button variant="outline" size="sm" onClick={handleViewFile} disabled={fileLoading}>
              {fileLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {blobUrl ? "닫기" : "파일 열기"}
            </Button>
          )}
        </div>

        {doc.fileType !== "PDF" ? (
          <p className="text-sm text-muted-foreground">
            PPT/PPTX 파일은 브라우저 미리보기를 지원하지 않습니다. AI 학습 기능을 이용해주세요.
          </p>
        ) : blobUrl ? (
          <iframe
            src={blobUrl}
            className="w-full rounded-lg border"
            style={{ height: "75vh" }}
            title={doc.originalFileName}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            버튼을 눌러 PDF를 불러오세요.
          </p>
        )}
      </div>
    </div>
  );
}
