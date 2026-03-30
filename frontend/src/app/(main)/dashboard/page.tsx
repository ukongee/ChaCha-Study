"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  Trash2,
  BookOpen,
  Loader2,
  Plus,
  FileUp,
} from "lucide-react";
import { format } from "@/lib/format";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/stores/authStore";
import { documentsApi } from "@/lib/api/documents";
import type { Document } from "@/types/study.types";

const FILE_ACCEPT = ".pdf,.ppt,.pptx";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: documentsApi.getDocuments,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      documentsApi.uploadDocument(file, setUploadProgress),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("파일 업로드 완료! AI 인덱싱을 시작합니다...");
      setUploadOpen(false);
      setUploadProgress(0);

      // 백그라운드로 RAG 인제스트 트리거 (실패해도 UX 영향 없음)
      documentsApi.ingestDocument(doc.id)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          toast.success("AI 인덱싱 완료! 채팅 기능을 사용할 수 있습니다.");
        })
        .catch(() => {
          toast.warning("AI 인덱싱에 실패했습니다. 문서 상세에서 재시도할 수 있습니다.");
        });
    },
    onError: () => {
      toast.error("파일 업로드에 실패했습니다");
      setUploadProgress(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("문서가 삭제되었습니다");
    },
    onError: () => {
      toast.error("문서 삭제에 실패했습니다");
    },
  });

  const handleFileSelect = useCallback(
    (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error("파일 크기는 50MB 이하여야 합니다");
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "ppt", "pptx"].includes(ext || "")) {
        toast.error("PDF, PPT, PPTX 파일만 업로드할 수 있습니다");
        return;
      }
      uploadMutation.mutate(file);
    },
    [uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            안녕하세요, {user?.user_metadata?.name ?? "학생"}님!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            오늘도 효율적인 학습을 시작해보세요
          </p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="w-4 h-4" />
                자료 업로드
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>학습 자료 업로드</DialogTitle>
            </DialogHeader>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {uploadMutation.isPending ? (
                <div className="space-y-3">
                  <Loader2 className="w-8 h-8 mx-auto text-blue-500 animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    업로드 중... {uploadProgress}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <FileUp className="w-8 h-8 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">
                      파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, PPT, PPTX (최대 50MB)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    파일 선택
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={FILE_ACCEPT}
                    className="hidden"
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">총 문서</p>
              <p className="text-lg font-bold">
                {isLoading ? "-" : documents?.length ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">학습 가능</p>
              <p className="text-lg font-bold">
                {isLoading ? "-" : documents?.length ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Upload className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">이번 주 업로드</p>
              <p className="text-lg font-bold">
                {isLoading ? "-" : documents?.length ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 문서 목록 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          내 학습 자료
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !documents?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-muted-foreground">
                아직 업로드한 자료가 없습니다
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => setUploadOpen(true)}
              >
                <Plus className="w-4 h-4" />첫 자료 업로드하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc: Document) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={() => deleteMutation.mutate(doc.id)}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({
  document: doc,
  onDelete,
  isDeleting,
}: {
  document: Document;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const typeColor: Record<string, string> = {
    PDF: "bg-red-50 text-red-700",
    PPT: "bg-orange-50 text-orange-700",
    PPTX: "bg-orange-50 text-orange-700",
  };

  return (
    <Card className="hover:ring-2 hover:ring-blue-200 transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate text-sm">
              {doc.originalFileName}
            </CardTitle>
            <CardDescription className="mt-1">
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
      <CardContent className="flex items-center gap-2 pt-0">
        <Link href={`/study/${doc.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <BookOpen className="w-3.5 h-3.5" />
            학습하기
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </CardContent>
    </Card>
  );
}
