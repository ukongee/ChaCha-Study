export interface Document {
  id: string;
  originalFileName: string;
  fileType: "PDF" | "PPT" | "PPTX";
  pageCount: number;
  fileSize: number;
  embeddingStatus: "pending" | "processing" | "done" | "failed";
  createdAt: string;
}

export type Keyword = { text: string; page: number | null } | string;

export interface PageSummary {
  page: number;
  title: string;
  summary: string;
  detailedExplanation?: string;
  easyExplanation?: string; // legacy
  keyTerms?: string[];
}

export interface SummaryResponse {
  briefSummary: string;
  pages: PageSummary[];
  totalPages?: number;
  complete?: boolean;
}

export interface ExamPoint {
  topic: string;
  point: string;
  reason?: string;
  page?: number | null;
}

export interface ConfusingConcept {
  conceptA: string;
  conceptB: string;
  difference: string;
}

export interface MemorizationPoint {
  content: string;
  page?: number | null;
}

export interface ExamPointsResponse {
  examPoints: ExamPoint[];
  confusingConcepts: ConfusingConcept[];
  memorizationPoints: MemorizationPoint[];
}

export interface QuizItem {
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  sourcePage?: number | null;
}
export interface QuizResponse { quizzes: QuizItem[] }

export interface FlashcardItem {
  front: string;
  back: string;
  sourcePage?: number | null;
}
export interface FlashcardResponse { flashcards: FlashcardItem[] }

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface MindmapNode {
  label: string;
  summary?: string;
  children?: MindmapNode[];
}
export interface MindmapResponse {
  title: string;
  summary?: string;
  children: MindmapNode[];
}

export interface MemorizeSection {
  title: string;
  mustKnow: string[];
  keywords: string[];
  tip?: string;
}
export interface MemorizeResponse { sections: MemorizeSection[] }

export interface ConceptItem {
  term: string;
  definition: string;
  example?: string;
  relatedTerms?: string[];
  sourcePage?: number | null;
}
export interface ConceptsResponse { concepts: ConceptItem[] }

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    page: number | null;
    sectionTitle: string | null;
    excerpt: string;
  }>;
  createdAt?: string;
}
