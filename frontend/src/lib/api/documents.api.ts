import apiClient from "./client";
import type { ApiResponse } from "@/types/api.types";
import type { Document } from "@/types/study.types";

export const documentsApi = {
  getDocuments: async (): Promise<Document[]> => {
    const res = await apiClient.get<ApiResponse<Document[]>>("/api/documents");
    return res.data.data;
  },

  uploadDocument: async (file: File, onProgress?: (pct: number) => void): Promise<Document> => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post<ApiResponse<Document>>("/api/documents", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return res.data.data;
  },

  deleteDocument: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/documents/${id}`);
  },

  getFileBlobUrl: async (id: number): Promise<string> => {
    const res = await apiClient.get(`/api/documents/${id}/file`, {
      responseType: "blob",
    });
    return URL.createObjectURL(res.data);
  },
};
