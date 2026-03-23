"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Save, Key } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/stores/authStore";
import { useApiKeyStore, AI_MODELS } from "@/lib/stores/apiKeyStore";

export default function SettingsPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { apiKey, model, setApiKey, setModel } = useApiKeyStore();

  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(model);

  const handleSave = () => {
    setApiKey(localApiKey);
    setModel(localModel);
    toast.success("설정이 저장되었습니다");
  };

  const handleLogout = () => {
    clearAuth();
    toast.success("로그아웃되었습니다");
    router.push("/login");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-sm text-muted-foreground mt-1">
          계정 정보와 AI 설정을 관리합니다
        </p>
      </div>

      {/* 사용자 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>내 정보</CardTitle>
          <CardDescription>가입 시 등록한 정보입니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">닉네임</Label>
              <p className="text-sm font-medium mt-1">{user?.nickname ?? "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">학과</Label>
              <p className="text-sm font-medium mt-1">
                {user?.department ?? "-"}
              </p>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground text-xs">이메일</Label>
              <p className="text-sm font-medium mt-1">{user?.email ?? "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API 키 설정 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-muted-foreground" />
            <CardTitle>AI API 설정</CardTitle>
          </div>
          <CardDescription>
            AI 기능을 사용하려면 API 키를 등록하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>AI 모델</Label>
            <Select value={localModel} onValueChange={(v) => v !== null && setLocalModel(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="모델을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label} ({m.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4" />
            설정 저장
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* 로그아웃 */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
