"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useApiKey } from "@/hooks/useApiKey";

export default function Header() {
  const { apiKey } = useApiKey();

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white border-b border-[#D1D9F0] px-4 py-3 flex items-center justify-between shadow-sm">
      <Link href="/study" className="flex items-center gap-2.5">
        <img
          src="/chacha.webp"
          alt="차차 마스코트"
          className="w-9 h-9 object-contain"
        />
        <div className="flex flex-col leading-tight">
          <span className="font-extrabold text-[#1A3FAA] text-sm tracking-tight">차차스터디</span>
          <span className="text-[9px] text-[#5B6887]">충남대학교 AI 학습 도우미</span>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        {!apiKey && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-medium border border-amber-200">
            API 키 없음
          </span>
        )}
        <Link href="/settings">
          <Settings className="w-5 h-5 text-[#8B96B0] hover:text-[#1A3FAA] transition" />
        </Link>
      </div>
    </header>
  );
}
