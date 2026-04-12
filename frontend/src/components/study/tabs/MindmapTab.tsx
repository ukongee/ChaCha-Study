"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import apiClient from "@/lib/api/client";
import TabShell from "@/components/study/TabShell";
import type { MindmapResponse, MindmapNode } from "@/types/study.types";
import { Loader2, Maximize2, ZoomIn, ZoomOut } from "lucide-react";

// ── Depth styles (light theme) ─────────────────────────────────────────────
const DEPTH_STYLES = [
  {
    node: "bg-[#1A3FAA] border-[#1A3FAA] text-white font-bold text-sm px-4 py-2 shadow-lg shadow-blue-200 cursor-default",
    line: "bg-[#1A3FAA]/25",
    expand: "bg-white/20 hover:bg-white/30 text-white border-white/30",
  },
  {
    node: "bg-white border-[#1A3FAA] text-[#1A3FAA] font-semibold text-sm px-3 py-1.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
    line: "bg-[#1A3FAA]/20",
    expand: "bg-[#EEF2FF] hover:bg-[#D1D9F0] text-[#1A3FAA] border-[#A8B8E8]",
  },
  {
    node: "bg-[#EEF2FF] border-[#A8B8E8] text-[#3B4A6B] font-medium text-xs px-3 py-1.5 hover:border-[#1A3FAA] transition-colors cursor-pointer",
    line: "bg-[#A8B8E8]/40",
    expand: "bg-white hover:bg-[#EEF2FF] text-[#5B6887] border-[#D1D9F0]",
  },
  {
    node: "bg-white border-[#D1D9F0] text-[#5B6887] text-xs px-2.5 py-1 hover:border-[#A8B8E8] transition-colors cursor-pointer",
    line: "bg-[#D1D9F0]",
    expand: "bg-[#F0F4FF] hover:bg-[#EEF2FF] text-[#8B96B0] border-[#D1D9F0]",
  },
];

// ── Node component ─────────────────────────────────────────────────────────
function MindmapNodeView({ node, depth = 0 }: { node: MindmapNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [showTooltip, setShowTooltip] = useState(false);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isRoot = depth === 0;
  const s = DEPTH_STYLES[Math.min(depth, DEPTH_STYLES.length - 1)];

  return (
    <div className="flex items-center">
      {/* Node */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="relative">
          <div
            className={`rounded-xl border whitespace-nowrap select-none ${s.node}`}
            style={{ maxWidth: 180 }}
            onMouseEnter={() => node.summary && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className="block truncate">{node.label}</span>
          </div>

          {/* Tooltip */}
          {showTooltip && node.summary && (
            <div className="absolute left-0 top-full mt-1.5 z-50 w-52 bg-white border border-[#D1D9F0] rounded-xl p-3 shadow-xl text-xs text-[#3B4A6B] leading-relaxed pointer-events-none">
              <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-l border-t border-[#D1D9F0] rotate-45" />
              {node.summary}
            </div>
          )}
        </div>

        {/* Expand / collapse button */}
        {hasChildren && !isRoot && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className={`w-5 h-5 rounded-md border text-[10px] flex items-center justify-center transition shrink-0 font-bold ${s.expand}`}
          >
            {expanded ? "−" : "+"}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && (isRoot || expanded) && (
        <div className="flex flex-col gap-2.5 relative pl-8 ml-1">
          {/* Vertical spine */}
          <div
            className={`absolute w-px top-[16px] bottom-[16px] ${s.line}`}
            style={{ left: "0px" }}
          />
          {node.children!.map((child, i) => (
            <div key={i} className="flex items-center relative">
              {/* Horizontal tick */}
              <div className={`absolute h-px w-8 ${s.line}`} style={{ left: "-32px" }} />
              <MindmapNodeView node={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Interactive canvas ─────────────────────────────────────────────────────
function MindmapCanvas({ data }: { data: MindmapResponse }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 40, y: 40, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTransform((t) => {
      const newScale = Math.min(3, Math.max(0.2, t.scale * factor));
      const ratio = newScale / t.scale;
      return {
        x: mx - ratio * (mx - t.x),
        y: my - ratio * (my - t.y),
        scale: newScale,
      };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, ox: transform.x, oy: transform.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTransform((t) => ({ ...t, x: panStart.current.ox + dx, y: panStart.current.oy + dy }));
  };

  const onMouseUp = () => setIsPanning(false);

  const fitToScreen = () => setTransform({ x: 40, y: 40, scale: 1 });
  const zoomIn = () => setTransform((t) => ({ ...t, scale: Math.min(3, +(t.scale * 1.2).toFixed(2)) }));
  const zoomOut = () => setTransform((t) => ({ ...t, scale: Math.max(0.2, +(t.scale * 0.8).toFixed(2)) }));

  return (
    <div className="relative flex-1 overflow-hidden bg-[#F8FAFF]" style={{ minHeight: 0 }}>
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle, #A8B8E8 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          backgroundPosition: `${transform.x % 28}px ${transform.y % 28}px`,
        }}
      />

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`absolute inset-0 ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={fitToScreen}
      >
        <div
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "0 0",
            display: "inline-block",
            padding: "20px 60px 60px 20px",
          }}
        >
          <MindmapNodeView
            node={{ label: data.title, summary: data.summary, children: data.children }}
            depth={0}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
        <button
          onClick={fitToScreen}
          title="화면에 맞추기 (더블클릭)"
          className="w-8 h-8 flex items-center justify-center bg-white border border-[#D1D9F0] rounded-lg shadow-sm hover:bg-[#EEF2FF] text-[#1A3FAA] transition"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={zoomIn}
          title="확대"
          className="w-8 h-8 flex items-center justify-center bg-white border border-[#D1D9F0] rounded-lg shadow-sm hover:bg-[#EEF2FF] text-[#1A3FAA] transition"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={zoomOut}
          title="축소"
          className="w-8 h-8 flex items-center justify-center bg-white border border-[#D1D9F0] rounded-lg shadow-sm hover:bg-[#EEF2FF] text-[#1A3FAA] transition"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/80 border border-[#D1D9F0] rounded-lg px-2 py-1 text-xs text-[#5B6887] font-medium backdrop-blur-sm">
        {Math.round(transform.scale * 100)}%
      </div>

    </div>
  );
}

// ── Main tab ───────────────────────────────────────────────────────────────
export default function MindmapTab({ documentId }: { documentId: string }) {
  const [data, setData] = useState<MindmapResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/api/ai/${documentId}/mindmap`);
        if (res.data) setData(res.data);
      } catch { /* 404 = not yet generated */ }
      setChecked(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate(force = false) {
    setGenerating(true);
    try {
      const res = await apiClient.post(`/api/ai/${documentId}/mindmap`, { force });
      setData(res.data);
    } catch {
    } finally {
      setGenerating(false);
    }
  }

  if (!checked) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 animate-spin text-[#8B96B0]" />
      </div>
    );
  }

  // Use TabShell only for empty/loading state; once we have data, render full canvas
  if (!data && !generating) {
    return (
      <TabShell
        title="마인드맵"
        isLoading={false}
        isEmpty={true}
        generating={false}
        onGenerate={() => generate(false)}
        emptyLabel="개념 계층 구조 마인드맵을 생성합니다."
      >
        {null}
      </TabShell>
    );
  }

  if (generating && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-4">
        <img src="/chacha.webp" alt="차차" className="w-16 h-16 object-contain animate-pulse" />
        <p className="text-[#5B6887] text-base font-medium">개념 구조를 분석 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D1D9F0] bg-white shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#0F1729]">마인드맵</h2>
          {data?.summary && (
            <p className="text-xs text-[#5B6887] mt-0.5">{data.summary}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {generating && <Loader2 className="w-4 h-4 animate-spin text-[#1A3FAA]" />}
          <button
            onClick={() => generate(true)}
            disabled={generating}
            className="flex items-center gap-1.5 text-sm text-[#8B96B0] hover:text-[#1A3FAA] disabled:opacity-30 transition font-medium"
          >
            재생성
          </button>
        </div>
      </div>

      {/* Interactive canvas fills remaining space */}
      {data && <MindmapCanvas data={data} />}
    </div>
  );
}
