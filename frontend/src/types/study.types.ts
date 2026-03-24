export interface Document {
  id: number;
  originalFileName: string;
  fileType: "PDF" | "PPT" | "PPTX";
  pageCount: number;
  fileSize: number;
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
}

export interface QuizResponse {
  quizzes: QuizItem[];
}

export interface FlashcardItem {
  front: string;
  back: string;
}

export interface FlashcardResponse {
  flashcards: FlashcardItem[];
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
