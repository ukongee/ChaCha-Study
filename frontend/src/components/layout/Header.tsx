"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut, Settings } from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useApiKeyStore } from "@/lib/stores/apiKeyStore";

export default function Header() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { isConfigured } = useApiKeyStore();

  const handleLogout = () => signOut();

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <BookOpen className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-gray-900">차차스터디</span>
      </Link>

      <div className="flex items-center gap-2">
        {!isConfigured() && (
          <Link
            href="/settings"
            className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-medium"
          >
            API 키 설정 필요
          </Link>
        )}
        <Link href="/settings">
          <Settings className="w-5 h-5 text-gray-500" />
        </Link>
        {user && (
          <button onClick={handleLogout}>
            <LogOut className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>
    </header>
  );
}
