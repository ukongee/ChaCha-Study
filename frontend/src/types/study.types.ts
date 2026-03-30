export interface Document {
  id: string;                              // UUID
  originalFileName: string;
  fileType: "PDF" | "PPT" | "PPTX";
  pageCount: number;
  fileSize: number;
  embeddingStatus: "pending" | "processing" | "done" | "failed";
  createdAt: string;
}

export type Keyword = { text: string; page: number | null } | string;

export interface SummaryResponse {
  briefSummary: string;
  detailedSummary: string;
  keywords: Keyword[];
  importantPoints: string[];
  pageSummaries?: Array<{
    page: number;
    title: string;
    summary: string;
  }>;
}

export interface QuizItem {
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  sourcePage?: number | null;
}

export interface QuizResponse {
  quizzes: QuizItem[];
}

export interface FlashcardItem {
  front: string;
  back: string;
  sourcePage?: number | null;
}

export interface FlashcardResponse {
  flashcards: FlashcardItem[];
}

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

// 하위 호환 re-export (기존 import 경로 유지)
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    page: number | null;
    sectionTitle: string | null;
    excerpt: string;
  }>;
  createdAt: string;
}

export interface TranslationResponse {
  pages: Array<{
    page: number;
    text: string;
  }>;
}
