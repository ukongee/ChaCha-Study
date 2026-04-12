import apiClient from "./client";
import type {
  SummaryResponse,
  QuizResponse,
  FlashcardResponse,
  MindmapResponse,
  MemorizeResponse,
  ConceptsResponse,
  ChatMessage,
  Difficulty,
} from "@/types/study.types";

export const aiApi = {
  generateSummary: async (documentId: string, force = false): Promise<SummaryResponse> => {
    const res = await apiClient.post(`/api/ai/${documentId}/summary`, { force });
    return res.data;
  },

  generateQuiz: async (documentId: string, difficulty: Difficulty = "MEDIUM", count = 5, force = false): Promise<QuizResponse> => {
    const res = await apiClient.post(`/api/ai/${documentId}/quiz`, { difficulty, count, force });
    return res.data;
  },

  generateFlashcard: async (documentId: string, force = false): Promise<FlashcardResponse> => {
    const res = await apiClient.post(`/api/ai/${documentId}/flashcard`, { force });
    return res.data;
  },

  generateMindmap: async (documentId: string, force = false): Promise<MindmapResponse> => {
    const res = await apiClient.post(`/api/ai/${documentId}/mindmap`, { force });
    return res.data;
  },

  generateMemorize: async (documentId: string, force = false): Promise<MemorizeResponse> => {
    const res = await apiClient.post(`/api/ai/${documentId}/memorize`, { force });
    return res.data;
  },

  generateConcepts: async (documentId: string, force = false): Promise<ConceptsResponse> => {
    const res = await apiClient.post(`/api/ai/${documentId}/concepts`, { force });
    return res.data;
  },

  getChatHistory: async (documentId: string): Promise<ChatMessage[]> => {
    const res = await apiClient.get(`/api/ai/${documentId}/chat`);
    return res.data;
  },

  sendChat: async (documentId: string, question: string): Promise<ChatMessage> => {
    const res = await apiClient.post(`/api/ai/${documentId}/chat`, { question });
    return res.data;
  },
};
