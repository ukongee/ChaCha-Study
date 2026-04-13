"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { documentsApi } from "@/lib/api/documents.api";

import SummaryTab from "@/components/study/tabs/SummaryTab";
import ExamPointsTab from "@/components/study/tabs/ExamPointsTab";
import MindmapTab from "@/components/study/tabs/MindmapTab";
import QuizTab from "@/components/study/tabs/QuizTab";
import FlashcardsTab from "@/components/study/tabs/FlashcardsTab";
import NotesTab from "@/components/study/tabs/NotesTab";
import TutorTab from "@/components/study/tabs/TutorTab";

const TABS = [
  { key: "summary",     label: "요약" },
  { key: "exam-points", label: "시험 포인트" },
  { key: "mindmap",     label: "마인드맵" },
  { key: "quiz",        label: "퀴즈" },
  { key: "flashcards",  label: "플래시카드" },
  { key: "notes",       label: "메모" },
  { key: "tutor",       label: "AI Tutor" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function StudyWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFetchError, setPdfFetchError] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const { data: doc, isLoading } = useQuery({
    queryKey: ["document", id],
    queryFn: () => documentsApi.getDocument(id),
  });

  const pdfLoading = doc?.fileType === "PDF" && pdfUrl === null && !pdfFetchError;

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }, []);

  useEffect(() => {
    if (doc?.fileType === "PDF") {
      documentsApi.getFileUrl(id)
        .then((url) => setPdfUrl(url))
        .catch(() => setPdfFetchError(true));
    }
  }, [doc, id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[#8B96B0]">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <img src="/chacha.webp" alt="차차" className="w-16 h-16 object-contain opacity-40" />
        <p className="text-[#8B96B0] text-base">문서를 찾을 수 없습니다.</p>
        <Link href="/study" className="text-[#1A3FAA] text-base font-semibold hover:underline">목록으로</Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F4FF]">
      {/* ── Left: PDF Viewer ──────────────────────────────────── */}
      <div className="w-[45%] min-w-0 flex flex-col border-r border-[#D1D9F0] bg-white">
        {/* PDF header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#D1D9F0] shrink-0 bg-white">
          <Link href="/study" className="text-[#8B96B0] hover:text-[#1A3FAA] transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-[#0F1729] truncate">{doc.originalFileName}</p>
            <p className="text-sm text-[#8B96B0]">{doc.pageCount}페이지</p>
          </div>
          {/* Embedding status badge hidden (AI Tutor disabled)
          <span className={`text-sm px-2.5 py-0.5 rounded-md font-medium ${
            doc.embeddingStatus === "done"
              ? "bg-green-100 text-green-600 border border-green-200"
              : doc.embeddingStatus === "processing"
              ? "bg-yellow-100 text-yellow-600 border border-yellow-200"
              : "bg-[#EEF2FF] text-[#8B96B0]"
          }`}>
            {doc.embeddingStatus === "done" ? "인덱싱 완료"
              : doc.embeddingStatus === "processing" ? "인덱싱 중..."
              : doc.embeddingStatus === "failed" ? "인덱싱 실패"
              : "대기 중"}
          </span>
          */}
        </div>

        {/* PDF content */}
        <div className="flex-1 overflow-hidden">
          {doc.fileType !== "PDF" ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4">
              <img src="/chacha.webp" alt="차차" className="w-20 h-20 object-contain opacity-30" />
              <p className="text-[#5B6887] text-base">PPT/PPTX 파일은 미리보기를 지원하지 않습니다.</p>
              <p className="text-[#8B96B0] text-sm">오른쪽 탭에서 AI 학습 기능을 이용하세요.</p>
            </div>
          ) : pdfLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-[#1A3FAA]" />
            </div>
          ) : pdfUrl ? (
            isIOS ? (
              <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
                <img src="/chacha.webp" alt="차차" className="w-16 h-16 object-contain opacity-50" />
                <p className="text-[#5B6887] text-base">iPad Safari에서는 PDF 미리보기를 지원하지 않습니다.</p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A3FAA] text-white text-base font-semibold hover:bg-[#2B52CC] transition shadow-md shadow-blue-200"
                >
                  <FileText className="w-4 h-4" />
                  PDF 새 탭에서 열기
                </a>
              </div>
            ) : (
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title={doc.originalFileName}
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-[#8B96B0] text-base">
              PDF를 불러올 수 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Study tabs ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F0F4FF]">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 py-2.5 border-b border-[#D1D9F0] bg-white overflow-x-auto shrink-0 scrollbar-none shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-[#1A3FAA] text-white shadow-sm"
                  : "text-[#5B6887] hover:text-[#1A3FAA] hover:bg-[#EEF2FF]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content — always mounted to preserve state */}
        <div className="flex-1 overflow-hidden relative">
          <div className={`h-full overflow-y-auto ${activeTab === "summary"     ? "" : "hidden"}`}><SummaryTab     documentId={id} pageCount={doc.pageCount} /></div>
          <div className={`h-full overflow-y-auto ${activeTab === "exam-points" ? "" : "hidden"}`}><ExamPointsTab  documentId={id} /></div>
          <div className={`h-full overflow-hidden ${activeTab === "mindmap"     ? "" : "hidden"}`}><MindmapTab     documentId={id} /></div>
          <div className={`h-full overflow-y-auto ${activeTab === "quiz"        ? "" : "hidden"}`}><QuizTab        documentId={id} /></div>
          <div className={`h-full overflow-y-auto ${activeTab === "flashcards"  ? "" : "hidden"}`}><FlashcardsTab  documentId={id} /></div>
          <div className={`h-full overflow-y-auto ${activeTab === "notes"       ? "" : "hidden"}`}><NotesTab       documentId={id} /></div>
          <div className={`h-full overflow-hidden ${activeTab === "tutor"       ? "" : "hidden"}`}><TutorTab       documentId={id} /></div>
        </div>
      </div>
    </div>
  );
}
