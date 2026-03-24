"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BookOpen, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authApi } from "@/lib/api/auth.api";

const DEPARTMENTS = [
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
] as const;

const registerSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다")
    .max(20, "닉네임은 20자 이하여야 합니다"),
  department: z.string().min(1, "학과를 선택해주세요"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { department: "" },
  });

  const department = watch("department");

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await authApi.signUp(data);
      toast.success("회원가입 완료! 로그인해주세요.");
      router.push("/login");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "회원가입에 실패했습니다";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
        </div>
        <CardTitle className="text-xl">회원가입</CardTitle>
        <p className="text-sm text-muted-foreground">
          차차스터디에 가입하고 AI 학습을 시작하세요
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@cnu.ac.kr"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="6자 이상 입력하세요"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              placeholder="닉네임을 입력하세요"
              {...register("nickname")}
              aria-invalid={!!errors.nickname}
            />
            {errors.nickname && (
              <p className="text-xs text-destructive">
                {errors.nickname.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>학과</Label>
            <Select
              value={department ?? ""}
              onValueChange={(val) => val !== null && setValue("department", val, { shouldValidate: true })}
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            가입하기
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="text-blue-600 font-medium hover:underline"
          >
            로그인
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
