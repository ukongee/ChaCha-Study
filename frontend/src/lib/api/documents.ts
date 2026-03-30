import apiClient from "./client";
import type { Document } from "@/types/study.types";

export const documentsApi = {
  getDocuments: async (): Promise<Document[]> => {
    const res = await apiClient.get<Document[]>("/api/documents");
    return res.data;
  },

  getDocument: async (id: string): Promise<Document> => {
    const res = await apiClient.get<Document>(`/api/documents/${id}`);
    return res.data;
  },

  uploadDocument: async (file: File, onProgress?: (pct: number) => void): Promise<Document> => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post<Document>("/api/documents/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
      onUploadProgress: onProgress
        ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total ?? e.loaded)))
        : undefined,
    });
    return res.data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/documents/${id}`);
  },

  /** 업로드 후 RAG 인제스트 트리거 */
  ingestDocument: async (id: string): Promise<{ chunkCount: number }> => {
    const res = await apiClient.post<{ chunkCount: number }>(
      `/api/documents/${id}/ingest`,
      {},
      { timeout: 300000 } // 임베딩 최대 5분
    );
    return res.data;
  },
};
