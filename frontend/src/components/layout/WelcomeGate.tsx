"use client";

import { useState } from "react";
import Image from "next/image";
import { useApiKey } from "@/hooks/useApiKey";
import {
  FileText,
  BrainCircuit,
  ListChecks,
  Layers,
  Network,
  MessageSquare,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  X,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  { icon: FileText,       label: "페이지별 요약",   desc: "강의 내용을 페이지 단위로 정리" },
  { icon: ListChecks,     label: "시험 포인트",      desc: "핵심 개념과 출제 포인트 추출" },
  { icon: Network,        label: "마인드맵",         desc: "개념 계층 구조 시각화" },
  { icon: BrainCircuit,   label: "퀴즈 생성",        desc: "자동 생성된 문제로 자기 평가" },
  { icon: Layers,         label: "플래시카드",       desc: "용어·개념 암기 카드" },
  { icon: MessageSquare,  label: "AI Tutor",         desc: "강의 내용 기반 질문 응답" },
];

function ApiKeyModal({ onClose }: { onClose: () => void }) {
  const { setApiKey } = useApiKey();
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);

  function handleSave() {
    const key = input.trim();
    if (!key) return;
    setApiKey(key);
    toast.success("API 키가 저장되었습니다. 차차스터디를 시작합니다!");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0F1729]/40 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#D1D9F0] p-7">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8B96B0] hover:text-[#1A3FAA] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-5">
          <Image src="/chacha.webp" alt="차차" width={40} height={40} className="object-contain" />
          <div>
            <p className="text-base font-extrabold text-[#0F1729]">CNU AI API 키로 시작하기</p>
            <p className="text-sm text-[#5B6887]">충남대학교 AI 포털에서 발급받은 키를 입력하세요.</p>
          </div>
        </div>

        {/* Key input */}
        <div className="relative mb-3">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
            <KeyRound className="w-4 h-4 text-[#8B96B0]" />
          </div>
          <input
            type={show ? "text" : "password"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="API 키를 붙여넣으세요"
            className="w-full bg-[#F0F4FF] border border-[#D1D9F0] rounded-xl pl-10 pr-11 py-3 text-base text-[#0F1729] placeholder-[#8B96B0] focus:outline-none focus:border-[#1A3FAA] focus:ring-2 focus:ring-[#1A3FAA]/20 transition"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8B96B0] hover:text-[#1A3FAA] transition"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!input.trim()}
          className="w-full py-3 rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] disabled:opacity-40 text-white text-base font-semibold transition flex items-center justify-center gap-2 shadow-md shadow-blue-200 mb-4"
        >
          <Check className="w-4 h-4" />
          저장하고 시작하기
        </button>

        {/* Security note */}
        <div className="flex items-start gap-2.5 p-3 bg-[#F0F4FF] rounded-xl mb-3">
          <Shield className="w-4 h-4 text-[#1A3FAA] mt-0.5 shrink-0" />
          <div className="text-xs text-[#5B6887] leading-relaxed space-y-0.5">
            <p><span className="text-[#0F1729] font-semibold">이 기기에만 저장</span>됩니다 — 차차 서버 DB에 기록되지 않아요.</p>
            <p>AI 기능 요청 시 CNU AI 포털로만 전달됩니다.</p>
          </div>
        </div>

        {/* Portal link */}
        <a
          href="https://aiportal.cnu.ac.kr/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-[#1A3FAA] hover:text-[#2B52CC] transition font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          CNU AI 포털에서 API 키 발급받기
        </a>
      </div>
    </div>
  );
}

export default function WelcomeGate({ children }: { children: React.ReactNode }) {
  const { apiKey } = useApiKey();
  const [modalOpen, setModalOpen] = useState(false);

  if (apiKey) return <>{children}</>;

  return (
    <>
      {/* Landing page */}
      <div className="min-h-screen bg-[#F0F4FF] flex flex-col items-center justify-center px-6 py-16">
        {/* Logo & title */}
        <div className="flex flex-col items-center mb-10 text-center">
          <Image
            src="/chacha.webp"
            alt="차차"
            width={80}
            height={80}
            className="object-contain mb-4"
          />
          <h1 className="text-4xl font-extrabold text-[#0F1729] mb-3">차차스터디</h1>
          <p className="text-base text-[#5B6887] max-w-sm leading-relaxed">
            강의 PDF를 업로드하면 <span className="text-[#1A3FAA] font-semibold">요약 · 퀴즈 · 플래시카드 · 마인드맵</span>으로
            AI가 공부를 도와주는 충남대 학습 도우미
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10 w-full max-w-lg">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col gap-1.5 bg-white border border-[#D1D9F0] rounded-2xl p-4 shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#1A3FAA]" />
              </div>
              <p className="text-sm font-semibold text-[#0F1729]">{label}</p>
              <p className="text-xs text-[#8B96B0] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => setModalOpen(true)}
          className="px-8 py-3.5 rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] text-white text-base font-bold transition shadow-lg shadow-blue-300 flex items-center gap-2"
        >
          <KeyRound className="w-4 h-4" />
          CNU AI API 키로 시작하기
        </button>

        <p className="mt-4 text-xs text-[#8B96B0]">
          충남대학교 구성원만 이용 가능합니다 ·{" "}
          <a
            href="https://aiportal.cnu.ac.kr/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#1A3FAA] transition"
          >
            API 키 발급
          </a>
        </p>
      </div>

      {/* Modal */}
      {modalOpen && <ApiKeyModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
