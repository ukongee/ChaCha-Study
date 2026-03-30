import apiClient from "./client";
import type {
  SummaryResponse,
  QuizResponse,
  FlashcardResponse,
  Difficulty,
} from "@/types/study.types";

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

export const aiApi = {
  generateSummary: async (documentId: string, model: string): Promise<SummaryResponse> => {
    const res = await apiClient.post<SummaryResponse>(
      `/api/ai/${documentId}/summary`,
      { model }
    );
    return res.data;
  },

  generateQuiz: async (
    documentId: string,
    params: { difficulty: Difficulty; count: number; model: string }
  ): Promise<QuizResponse> => {
    const res = await apiClient.post<QuizResponse>(
      `/api/ai/${documentId}/quiz`,
      params
    );
    return res.data;
  },

  generateFlashcard: async (
    documentId: string,
    params: { model: string }
  ): Promise<FlashcardResponse> => {
    const res = await apiClient.post<FlashcardResponse>(
      `/api/ai/${documentId}/flashcard`,
      params
    );
    return res.data;
  },

  getChatHistory: async (documentId: string): Promise<ChatMessage[]> => {
    const res = await apiClient.get<ChatMessage[]>(`/api/ai/${documentId}/chat`);
    return res.data;
  },

  sendChat: async (
    documentId: string,
    question: string,
    model: string
  ): Promise<ChatMessage> => {
    const res = await apiClient.post<ChatMessage>(
      `/api/ai/${documentId}/chat`,
      { question, model }
    );
    return res.data;
  },

  clearChatHistory: async (documentId: string): Promise<void> => {
    await apiClient.delete(`/api/ai/${documentId}/chat`);
  },
};
