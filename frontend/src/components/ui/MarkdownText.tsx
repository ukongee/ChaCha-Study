"use client";

/**
 * Minimal markdown renderer for summary detailedExplanation.
 * Supports: ### headings, **bold**, - bullet lists, numbered lists, paragraphs.
 */

interface Props {
  content: string;
  className?: string;
}

function parseLine(line: string, key: number) {
  // Convert **bold** inline
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={i} className="font-semibold text-[#0F1729]">{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

export default function MarkdownText({ content, className = "" }: Props) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let orderedBuffer: { n: string; text: string }[] = [];

  function flushBullets() {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={elements.length} className="space-y-1 my-1.5 pl-1">
        {bulletBuffer.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-[#1A2050] leading-relaxed">
            <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-[#1A3FAA]/60 inline-block" />
            <span>{parseLine(item, i)}</span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  }

  function flushOrdered() {
    if (orderedBuffer.length === 0) return;
    elements.push(
      <ol key={elements.length} className="space-y-1 my-1.5 pl-1">
        {orderedBuffer.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-[#1A2050] leading-relaxed">
            <span className="shrink-0 font-semibold text-[#1A3FAA] min-w-[1.2rem]">{item.n}.</span>
            <span>{parseLine(item.text, i)}</span>
          </li>
        ))}
      </ol>
    );
    orderedBuffer = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      flushBullets();
      flushOrdered();
      continue;
    }

    // ### heading
    if (trimmed.startsWith("### ")) {
      flushBullets(); flushOrdered();
      elements.push(
        <p key={elements.length} className="text-sm font-bold text-[#1A3FAA] mt-3 mb-1">
          {trimmed.slice(4)}
        </p>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushBullets(); flushOrdered();
      elements.push(
        <p key={elements.length} className="text-sm font-bold text-[#1A3FAA] mt-3 mb-1">
          {trimmed.slice(3)}
        </p>
      );
      continue;
    }

    // bullet: - or •
    if (/^[-•]\s+/.test(trimmed)) {
      flushOrdered();
      bulletBuffer.push(trimmed.replace(/^[-•]\s+/, ""));
      continue;
    }

    // numbered: 1. 2. etc
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushBullets();
      orderedBuffer.push({ n: numMatch[1], text: numMatch[2] });
      continue;
    }

    // regular paragraph line
    flushBullets(); flushOrdered();
    elements.push(
      <p key={elements.length} className="text-sm text-[#1A2050] leading-relaxed">
        {parseLine(trimmed, i)}
      </p>
    );
  }

  flushBullets();
  flushOrdered();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
