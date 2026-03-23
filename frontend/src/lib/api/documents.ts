import apiClient from "./client";
import type { ApiResponse, PageResponse } from "@/types/api.types";
import type { Document } from "@/types/study.types";

export const documentsApi = {
  getDocuments: async (): Promise<Document[]> => {
    const res = await apiClient.get<ApiResponse<Document[]>>("/api/documents");
    return res.data.data;
  },

  uploadDocument: async (file: File): Promise<Document> => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post<ApiResponse<Document>>("/api/documents", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  deleteDocument: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/documents/${id}`);
  },
};
