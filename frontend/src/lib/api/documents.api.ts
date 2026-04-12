import apiClient from "./client";
import type { Document } from "@/types/study.types";

function mapDoc(d: Record<string, unknown>): Document {
  return {
    id: d.id as string,
    originalFileName: d.original_file_name as string,
    fileType: d.file_type as Document["fileType"],
    pageCount: d.page_count as number,
    fileSize: d.file_size as number,
    embeddingStatus: d.embedding_status as Document["embeddingStatus"],
    createdAt: d.created_at as string,
  };
}

export const documentsApi = {
  getDocuments: async (): Promise<Document[]> => {
    const res = await apiClient.get<Record<string, unknown>[]>("/api/documents");
    return res.data.map(mapDoc);
  },

  getDocument: async (id: string): Promise<Document> => {
    const res = await apiClient.get<Record<string, unknown>>(`/api/documents/${id}`);
    return mapDoc(res.data);
  },

  uploadDocument: async (file: File, onProgress?: (pct: number) => void): Promise<Document> => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post<Record<string, unknown>>("/api/documents/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return mapDoc(res.data);
  },

  ingestDocument: async (id: string): Promise<{ chunkCount: number }> => {
    const res = await apiClient.post(`/api/documents/${id}/ingest`);
    return res.data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/documents/${id}`);
  },

  getNotes: async (id: string): Promise<{ content: string; updated_at: string | null }> => {
    const res = await apiClient.get(`/api/documents/${id}/notes`);
    return res.data;
  },

  saveNotes: async (id: string, content: string): Promise<void> => {
    await apiClient.put(`/api/documents/${id}/notes`, { content });
  },

  /** Returns a signed Supabase Storage URL for the PDF file via server */
  getFileUrl: async (id: string): Promise<string> => {
    const res = await apiClient.get<{ url: string }>(`/api/documents/${id}/file-url`);
    return res.data.url;
  },
};
