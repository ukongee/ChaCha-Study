"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Star } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { reviewsApi } from "@/lib/api/reviews.api";
import { format } from "@/lib/format";
import type { CourseReview } from "@/types/community.types";

const DIFFICULTY_COLOR: Record<string, string> = {
  "쉬움": "bg-green-50 text-green-700",
  "보통": "bg-yellow-50 text-yellow-700",
  "어려움": "bg-red-50 text-red-700",
};

export default function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", page, searchTerm],
    queryFn: () =>
      reviewsApi.getReviews({
        page,
        size: 10,
        courseName: searchTerm || undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">과목 후기</h1>
          <p className="text-sm text-muted-foreground mt-1">
            수강 경험을 공유하고 참고하세요
          </p>
        </div>
        <Link href="/reviews/new">
          <Button>
            <Plus className="w-4 h-4" />
            후기 작성
          </Button>
        </Link>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="과목명 또는 교수명으로 검색..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          className="pl-9"
        />
      </div>

      {/* 리뷰 목록 */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data?.content?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-muted-foreground">
              아직 후기가 없습니다
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.content.map((review: CourseReview) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last}
              >
                다음
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: CourseReview }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">{review.courseName}</CardTitle>
            <CardDescription className="mt-1">
              {review.professorName} 교수 &middot; {review.department}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{review.examType}</Badge>
          <Badge
            variant="secondary"
            className={DIFFICULTY_COLOR[review.difficulty] ?? ""}
          >
            {review.difficulty}
          </Badge>
        </div>

        {review.tip && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              수강 팁
            </p>
            <p className="text-sm leading-relaxed">{review.tip}</p>
          </div>
        )}

        {review.examInfo && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              시험 정보
            </p>
            <p className="text-sm leading-relaxed">{review.examInfo}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{review.author}</span>
          <span>{format.date(review.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
