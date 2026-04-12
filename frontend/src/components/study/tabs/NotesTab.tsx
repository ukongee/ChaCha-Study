"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, Loader2, Check } from "lucide-react";
import { documentsApi } from "@/lib/api/documents.api";

export default function NotesTab({ documentId }: { documentId: string }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["notes", documentId],
    queryFn: () => documentsApi.getNotes(documentId),
  });

  useEffect(() => {
    if (data) setContent(data.content);
  }, [data]);

  function handleChange(val: string) {
    setContent(val);
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(val), 1500);
  }

  async function save(text: string) {
    setSaving(true);
    try {
      await documentsApi.saveNotes(documentId, text);
      setSaved(true);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
          <h2 className="text-base font-bold text-[#0F1729]">메모</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <img src="/chacha.webp" alt="차차" className="w-16 h-16 object-contain animate-pulse" />
          <p className="text-[#5B6887] text-base font-medium">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
        <h2 className="text-base font-bold text-[#0F1729]">메모</h2>
        <div className="flex items-center gap-1.5 text-sm text-[#8B96B0] font-medium">
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중</>
          ) : saved ? (
            <><Check className="w-4 h-4 text-green-500" /> 저장됨</>
          ) : (
            <><Save className="w-4 h-4" /> 자동 저장</>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white">
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`강의를 들으며 메모를 작성하세요...\n\n자동 저장됩니다.`}
          className="w-full h-full resize-none bg-transparent text-base text-[#1A2050] placeholder-[#B0BAD0] p-5 focus:outline-none leading-relaxed"
          style={{ minHeight: "calc(100vh - 200px)" }}
        />
      </div>
    </div>
  );
}
