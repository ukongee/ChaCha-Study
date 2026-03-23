"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

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
import { communityApi } from "@/lib/api/community.api";

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

const postSchema = z.object({
  title: z
    .string()
    .min(2, "제목은 2자 이상이어야 합니다")
    .max(100, "제목은 100자 이하여야 합니다"),
  content: z.string().min(10, "내용은 10자 이상이어야 합니다"),
  courseName: z.string().min(1, "과목명을 입력해주세요"),
  department: z.string().min(1, "학과를 선택해주세요"),
  anonymous: z.boolean(),
});

type PostForm = z.infer<typeof postSchema>;

export default function CommunityNewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      anonymous: false,
      department: "",
    },
  });

  const department = watch("department");
  const anonymous = watch("anonymous");

  const onSubmit = async (data: PostForm) => {
    setIsLoading(true);
    try {
      await communityApi.createPost(data);
      toast.success("게시글이 작성되었습니다");
      router.push("/community");
    } catch {
      toast.error("게시글 작성에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        목록으로
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>글쓰기</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="제목을 입력하세요"
                {...register("title")}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                placeholder="내용을 입력하세요"
                rows={8}
                {...register("content")}
                aria-invalid={!!errors.content}
              />
              {errors.content && (
                <p className="text-xs text-destructive">
                  {errors.content.message}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setValue("anonymous", e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">익명으로 작성</span>
            </label>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                게시하기
              </Button>
              <Link href="/community">
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
