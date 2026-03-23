import apiClient from "./client";
import type { ApiResponse, PageResponse } from "@/types/api.types";
import type {
  Document,
  SummaryResponse,
  QuizResponse,
  FlashcardResponse,
  ChatMessage,
  Difficulty,
} from "@/types/study.types";

export const documentApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<ApiResponse<Document>>("/api/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getMyDocuments: () =>
    apiClient.get<ApiResponse<Document[]>>("/api/documents"),
};

export const aiApi = {
  summarize: (documentId: number, model: string) =>
    apiClient.post<ApiResponse<SummaryResponse>>("/api/ai/summary", {
      documentId,
      model,
    }),

  generateQuiz: (
    documentId: number,
    model: string,
    quizCount: number,
    difficulty: Difficulty
  ) =>
    apiClient.post<ApiResponse<QuizResponse>>("/api/ai/quiz", {
      documentId,
      model,
      quizCount,
      difficulty,
    }),

  generateFlashcards: (documentId: number, model: string) =>
    apiClient.post<ApiResponse<FlashcardResponse>>("/api/ai/flashcard", {
      documentId,
      model,
    }),
};

export const chatApi = {
  sendMessage: (documentId: number, model: string, message: string) =>
    apiClient.post<ApiResponse<ChatMessage>>("/api/chat", {
      documentId,
      model,
      message,
    }),

  getHistory: (documentId: number) =>
    apiClient.get<ApiResponse<ChatMessage[]>>(
      `/api/chat/${documentId}/history`
    ),

  clearHistory: (documentId: number) =>
    apiClient.delete(`/api/chat/${documentId}/history`),
};
