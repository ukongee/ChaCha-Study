import apiClient from "./client";
import type { ApiResponse } from "@/types/api.types";
import type {
  SummaryResponse,
  QuizResponse,
  FlashcardResponse,
  ChatMessage,
  Difficulty,
  TranslationResponse,
} from "@/types/study.types";

export const aiApi = {
  getSummary: async (documentId: number): Promise<SummaryResponse> => {
    const res = await apiClient.get<ApiResponse<SummaryResponse>>(
      `/api/ai/${documentId}/summary`
    );
    return res.data.data;
  },

  generateSummary: async (documentId: number, model: string): Promise<SummaryResponse> => {
    const res = await apiClient.post<ApiResponse<SummaryResponse>>(
      `/api/ai/${documentId}/summary`,
      { model }
    );
    return res.data.data;
  },

  generateQuiz: async (
    documentId: number,
    difficulty: Difficulty,
    count: number,
    model: string
  ): Promise<QuizResponse> => {
    const res = await apiClient.post<ApiResponse<QuizResponse>>(
      `/api/ai/${documentId}/quiz`,
      { difficulty, count, model }
    );
    return res.data.data;
  },

  generateFlashcard: async (
    documentId: number,
    count: number,
    model: string
  ): Promise<FlashcardResponse> => {
    const res = await apiClient.post<ApiResponse<FlashcardResponse>>(
      `/api/ai/${documentId}/flashcard`,
      { count, model }
    );
    return res.data.data;
  },

  getChatHistory: async (documentId: number): Promise<ChatMessage[]> => {
    const res = await apiClient.get<ApiResponse<ChatMessage[]>>(
      `/api/ai/${documentId}/chat`
    );
    return res.data.data;
  },

  sendChat: async (
    documentId: number,
    question: string,
    model: string
  ): Promise<ChatMessage> => {
    const res = await apiClient.post<ApiResponse<ChatMessage>>(
      `/api/ai/${documentId}/chat`,
      { question, model }
    );
    return res.data.data;
  },

  getTranslation: async (documentId: number): Promise<TranslationResponse | null> => {
    const res = await apiClient.get<ApiResponse<TranslationResponse>>(
      `/api/ai/${documentId}/translation`
    );
    return res.data.data ?? null;
  },

  generateTranslation: async (documentId: number, model: string): Promise<TranslationResponse> => {
    const res = await apiClient.post<ApiResponse<TranslationResponse>>(
      `/api/ai/${documentId}/translation`,
      { model }
    );
    return res.data.data;
  },
};
