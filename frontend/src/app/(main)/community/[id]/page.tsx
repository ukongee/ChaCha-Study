"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Heart, Eye, Calendar } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { communityApi } from "@/lib/api/community.api";
import { format } from "@/lib/format";

export default function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const postId = Number(id);
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => communityApi.getPost(postId),
  });

  const likeMutation = useMutation({
    mutationFn: () => communityApi.likePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      toast.success("좋아요를 눌렀습니다");
    },
    onError: () => {
      toast.error("이미 좋아요를 눌렀습니다");
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">게시글을 찾을 수 없습니다</p>
        <Link href="/community">
          <Button variant="outline" className="mt-3">
            목록으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        목록으로
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{post.title}</CardTitle>
            <Badge variant="secondary">{post.courseName}</Badge>
          </div>
          <CardDescription className="flex items-center gap-3 mt-2">
            <span>{post.anonymous ? "익명" : post.author}</span>
            <span>{post.department}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format.date(post.createdAt)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed text-sm">
              {post.content}
            </p>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <Heart className="w-4 h-4" />
              좋아요 {post.likeCount}
            </Button>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              조회 {post.viewCount}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
