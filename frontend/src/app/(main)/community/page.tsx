"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Heart,
  Eye,
  MessageSquare,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { communityApi } from "@/lib/api/community.api";
import { format } from "@/lib/format";
import type { Post } from "@/types/community.types";

const DEPARTMENTS = [
  "전체",
  "컴퓨터공학과",
  "소프트웨어공학과",
  "전기공학과",
  "기계공학과",
  "경영학과",
  "경제학과",
  "화학공학과",
  "수학과",
  "물리학과",
  "영어영문학과",
  "행정학과",
  "의학과",
  "간호학과",
];

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("전체");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["posts", page, searchTerm, department],
    queryFn: () =>
      communityApi.getPosts({
        page,
        size: 10,
        courseName: searchTerm || undefined,
        department: department === "전체" ? undefined : department,
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">자료 공유</h1>
          <p className="text-sm text-muted-foreground mt-1">
            학습 자료와 정보를 공유하세요
          </p>
        </div>
        <Link href="/community/new">
          <Button>
            <Plus className="w-4 h-4" />
            글쓰기
          </Button>
        </Link>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="과목명으로 검색..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={department}
          onValueChange={(v) => {
            if (v !== null) setDepartment(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="학과 필터" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 게시글 목록 */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
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
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-muted-foreground">
              아직 게시글이 없습니다
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.content.map((post: Post) => (
            <Link key={post.id} href={`/community/${post.id}`}>
              <Card className="hover:ring-2 hover:ring-blue-200 transition-all cursor-pointer mb-3">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm line-clamp-1">
                      {post.title}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {post.courseName}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {post.anonymous ? "익명" : post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {post.likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.viewCount}
                    </span>
                    <span className="ml-auto">
                      {format.date(post.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* 페이지네이션 */}
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
