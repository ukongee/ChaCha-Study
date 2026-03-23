"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Star } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reviewsApi } from "@/lib/api/reviews.api";

const DEPARTMENTS = [
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

const EXAM_TYPES = ["중간", "기말", "과제", "출석"];
const DIFFICULTIES = ["쉬움", "보통", "어려움"];

const reviewSchema = z.object({
  courseName: z.string().min(1, "과목명을 입력해주세요"),
  professorName: z.string().min(1, "교수명을 입력해주세요"),
  department: z.string().min(1, "학과를 선택해주세요"),
  rating: z.number().min(1, "평점을 선택해주세요").max(5),
  examType: z.string().min(1, "시험 유형을 선택해주세요"),
  difficulty: z.string().min(1, "난이도를 선택해주세요"),
  tip: z.string().optional(),
  examInfo: z.string().optional(),
});

type ReviewForm = z.infer<typeof reviewSchema>;

export default function ReviewNewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      department: "",
      examType: "",
      difficulty: "",
    },
  });

  const department = watch("department");
  const examType = watch("examType");
  const difficulty = watch("difficulty");
  const rating = watch("rating");

  const onSubmit = async (data: ReviewForm) => {
    setIsLoading(true);
    try {
      await reviewsApi.createReview(data);
      toast.success("후기가 작성되었습니다");
      router.push("/reviews");
    } catch {
      toast.error("후기 작성에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/reviews"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        목록으로
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>과목 후기 작성</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseName">과목명</Label>
                <Input
                  id="courseName"
                  placeholder="예: 자료구조"
                  {...register("courseName")}
                  aria-invalid={!!errors.courseName}
                />
                {errors.courseName && (
                  <p className="text-xs text-destructive">
                    {errors.courseName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="professorName">교수명</Label>
                <Input
                  id="professorName"
                  placeholder="예: 홍길동"
                  {...register("professorName")}
                  aria-invalid={!!errors.professorName}
                />
                {errors.professorName && (
                  <p className="text-xs text-destructive">
                    {errors.professorName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>학과</Label>
              <Select
                value={department}
                onValueChange={(v) => v !== null && setValue("department", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="학과를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-xs text-destructive">
                  {errors.department.message}
                </p>
              )}
            </div>

            {/* 별점 */}
            <div className="space-y-2">
              <Label>평점</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-0.5 transition-transform hover:scale-110"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setValue("rating", star)}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (hoverRating || rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-200"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    {rating}점
                  </span>
                )}
              </div>
              {errors.rating && (
                <p className="text-xs text-destructive">
                  {errors.rating.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시험 유형</Label>
                <Select
                  value={examType}
                  onValueChange={(v) => v !== null && setValue("examType", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="시험 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.examType && (
                  <p className="text-xs text-destructive">
                    {errors.examType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>난이도</Label>
                <Select
                  value={difficulty}
                  onValueChange={(v) => v !== null && setValue("difficulty", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="난이도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.difficulty && (
                  <p className="text-xs text-destructive">
                    {errors.difficulty.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tip">수강 팁 (선택)</Label>
              <Textarea
                id="tip"
                placeholder="수강 시 도움이 될 팁을 공유해주세요"
                rows={3}
                {...register("tip")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="examInfo">시험 정보 (선택)</Label>
              <Textarea
                id="examInfo"
                placeholder="시험 관련 정보를 공유해주세요"
                rows={3}
                {...register("examInfo")}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                후기 작성
              </Button>
              <Link href="/reviews">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
