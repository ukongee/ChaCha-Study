"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, BookOpen } from "lucide-react";

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
import { documentsApi } from "@/lib/api/documents.api";
import { format } from "@/lib/format";
import type { Document } from "@/types/study.types";

export default function StudyListPage() {
  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: documentsApi.getDocuments,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">학습하기</h1>
        <p className="text-sm text-muted-foreground mt-1">
          업로드한 자료를 선택해 AI 학습을 시작하세요
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !documents?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-muted-foreground text-sm">
              학습할 자료가 없습니다. 대시보드에서 자료를 업로드해주세요.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="mt-3">
                대시보드로 이동
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc: Document) => {
            const typeColor: Record<string, string> = {
              PDF: "bg-red-50 text-red-700",
              PPT: "bg-orange-50 text-orange-700",
              PPTX: "bg-orange-50 text-orange-700",
            };
            return (
              <Link key={doc.id} href={`/study/${doc.id}`}>
                <Card className="hover:ring-2 hover:ring-blue-200 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm truncate flex-1">
                        {doc.originalFileName}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className={typeColor[doc.fileType] ?? ""}
                      >
                        {doc.fileType}
                      </Badge>
                    </div>
                    <CardDescription>
                      {doc.pageCount}페이지 &middot;{" "}
                      {format.fileSize(doc.fileSize)} &middot;{" "}
                      {format.date(doc.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full">
                      <BookOpen className="w-3.5 h-3.5" />
                      학습 시작
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
