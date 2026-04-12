"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/study", icon: BookOpen, label: "학습하기" },
  { href: "/settings", icon: Settings, label: "설정" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-[#D1D9F0] px-3 py-6 shadow-sm">
      <Link href="/study" className="flex items-center gap-3 px-3 mb-8">
        <img
          src="/chacha.webp"
          alt="차차 마스코트"
          className="w-11 h-11 object-contain"
        />
        <div className="flex flex-col leading-tight">
          <span className="font-extrabold text-[#1A3FAA] text-base tracking-tight">차차스터디</span>
          <span className="text-[10px] text-[#5B6887] font-medium">충남대학교 AI 학습 도우미</span>
        </div>
      </Link>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-[#1A3FAA] text-white shadow-sm"
                : "text-[#5B6887] hover:bg-[#EEF2FF] hover:text-[#1A3FAA]"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 pt-4 border-t border-[#D1D9F0]">
        <p className="text-[10px] text-[#8B96B0] text-center">Chungnam National University</p>
      </div>
    </aside>
  );
}
