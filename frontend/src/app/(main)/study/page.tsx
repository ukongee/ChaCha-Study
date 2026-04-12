"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, BookOpen, Loader2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { documentsApi } from "@/lib/api/documents.api";
import type { Document } from "@/types/study.types";
import { format } from "@/lib/format";

export default function StudyListPage() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: documentsApi.getDocuments,
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setUploadProgress(0);

    try {
      const doc = await documentsApi.uploadDocument(file, setUploadProgress);
      toast.success(`"${file.name}" 업로드 완료`);
      qc.invalidateQueries({ queryKey: ["documents"] });

      // Trigger background ingest
      documentsApi.ingestDocument(doc.id).catch(() => {});
    } catch {
      toast.error("업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(id: string, name: string, e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`"${name}"을 삭제하시겠습니까?`)) return;
    setDeleting(id);
    try {
      await documentsApi.deleteDocument(id);
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(null);
    }
  }

  const typeColor: Record<string, string> = {
    PDF: "bg-red-100 text-red-600 border border-red-200",
    PPT: "bg-orange-100 text-orange-600 border border-orange-200",
    PPTX: "bg-orange-100 text-orange-600 border border-orange-200",
  };

  const statusBadge = (s: Document["embeddingStatus"]) => {
    if (s === "done") return <span className="text-sm text-green-600 font-medium">인덱싱 완료</span>;
    if (s === "processing") return <span className="text-sm text-yellow-600 font-medium flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" />인덱싱 중</span>;
    if (s === "failed") return <span className="text-sm text-red-500 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />인덱싱 실패</span>;
    return <span className="text-sm text-[#8B96B0]">대기 중</span>;
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F1729]">내 학습 자료</h1>
          <p className="text-base text-[#5B6887] mt-1">PDF 강의자료를 업로드하고 AI로 학습하세요</p>
        </div>

        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A3FAA] hover:bg-[#2B52CC] disabled:opacity-50 text-white text-base font-semibold transition shadow-md shadow-blue-200"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {uploading ? `업로드 중 ${uploadProgress}%` : "파일 업로드"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.ppt,.pptx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Upload progress bar */}
      {uploading && (
        <div className="mb-6 h-2 rounded-full bg-[#D1D9F0] overflow-hidden">
          <div
            className="h-full bg-[#1A3FAA] transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Drop zone (when empty) */}
      {!isLoading && documents.length === 0 && (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-[#A8B8E8] hover:border-[#1A3FAA] bg-white rounded-2xl py-24 text-center transition group"
        >
          <img
            src="/chacha.webp"
            alt="차차"
            className="w-20 h-20 mx-auto mb-4 opacity-60 group-hover:opacity-90 transition"
          />
          <p className="text-[#5B6887] group-hover:text-[#1A3FAA] transition text-base font-medium">
            PDF, PPT, PPTX 파일을 클릭하여 업로드
          </p>
          <p className="text-[#8B96B0] text-sm mt-2">최대 50MB</p>
        </button>
      )}

      {/* Document grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-[#D1D9F0] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc: Document) => (
            <Link key={doc.id} href={`/study/${doc.id}`}>
              <div className="group relative bg-white hover:bg-[#F5F8FF] border border-[#D1D9F0] hover:border-[#1A3FAA] rounded-2xl p-5 cursor-pointer transition shadow-sm hover:shadow-md hover:shadow-blue-100">
                {/* File type badge */}
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${typeColor[doc.fileType] ?? "bg-[#EEF2FF] text-[#5B6887]"}`}>
                  {doc.fileType}
                </span>

                <h3 className="mt-3 text-base font-semibold text-[#0F1729] leading-snug line-clamp-2">
                  {doc.originalFileName}
                </h3>

                <div className="mt-2">
                  <p className="text-sm text-[#8B96B0]">
                    {doc.pageCount}p · {format.fileSize(doc.fileSize)} · {format.date(doc.createdAt)}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  {statusBadge(doc.embeddingStatus)}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <BookOpen className="w-4 h-4 text-[#1A3FAA]" />
                    <span className="text-sm text-[#1A3FAA] font-semibold">학습 시작</span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(doc.id, doc.originalFileName, e)}
                  disabled={deleting === doc.id}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 text-[#8B96B0] hover:text-red-500 transition"
                >
                  {deleting === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
