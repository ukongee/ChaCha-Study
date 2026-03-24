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
  // 인문대학
  "국어국문학과", "영어영문학과", "독어독문학과", "불어불문학과", "중어중문학과",
  "일어일문학과", "한문학과", "언어학과", "사학과", "국사학과", "고고학과", "철학과",
  // 사회과학대학
  "사회학과", "문헌정보학과", "심리학과", "언론정보학과", "사회복지학과",
  "정치외교학과", "행정학부", "도시·자치융합학과",
  // 자연과학대학
  "수학과", "정보통계학과", "물리학과", "천문우주과학과", "화학과", "생화학과",
  "지질환경과학과", "해양환경과학과", "스포츠과학과", "무용학과", "반도체융합학과",
  // 경상대학
  "경제학과", "경영학부", "무역학과", "아시아비즈니스국제학과",
  // 공과대학
  "건축학과", "건축공학과", "토목공학과", "환경공학과", "기계공학부",
  "메카트로닉스공학과", "선박해양공학과", "항공우주공학과", "전기공학과",
  "전자공학과", "전파정보통신공학과", "컴퓨터융합학부", "인공지능학과",
  "신소재공학과", "응용화학공학과", "유기재료공학과", "자율운항시스템공학과",
  "에너지공학과", "정보통신융합학부",
  // 농업생명과학대학
  "식물자원학과", "원예학과", "산림환경자원학과", "환경소재공학과",
  "동물자원생명과학과", "동물바이오시스템과학과", "응용생물학과",
  "생물환경화학과", "식품공학과", "지역환경토목학과", "스마트농업시스템기계공학과",
  "농업경제학과",
  // 약학대학
  "약학과",
  // 의과대학
  "의예과", "의학과",
  // 수의과대학
  "수의예과", "수의학과",
  // 생활과학대학
  "의류학과", "식품영양학과", "소비자학과",
  // 예술대학
  "음악과", "관현악과", "회화과", "조소과", "디자인창의학과",
  // 사범대학
  "국어교육과", "영어교육과", "수학교육과", "교육학과", "체육교육과",
  "건설공학교육과", "기계공학교육과", "전기전자통신공학교육과", "화학공학교육과", "기술교육과",
  // 간호대학
  "간호학과",
  // 생명시스템과학대학
  "생물과학과", "미생물·분자생명과학과", "생명정보융합학과",
  // 기타
  "인문사회학과", "리더십과 조직과학과", "공공안전학과",
  "국토안보학전공", "해양안보학전공", "국제학부", "창의융합대학", "기타",
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
