"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/authStore";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "대시보드" },
  { href: "/study", icon: BookOpen, label: "학습하기" },
  { href: "/community", icon: Users, label: "자료 공유" },
  { href: "/reviews", icon: Star, label: "과목 후기" },
  { href: "/settings", icon: Settings, label: "설정" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-gray-100 px-3 py-6">
      {/* 로고 */}
      <Link href="/dashboard" className="flex items-center gap-2 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-lg">차차스터디</span>
      </Link>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* 유저 정보 */}
      {user && (
        <div className="px-3 pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-900">{user.user_metadata?.name ?? user.email}</p>
          <p className="text-xs text-gray-500 mt-0.5">{user.user_metadata?.department ?? ""}</p>
        </div>
      )}
    </aside>
  );
}
