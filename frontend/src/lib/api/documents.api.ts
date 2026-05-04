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
    onProgress?.(2);

    // Step 1: Get a signed upload URL (tiny JSON request — bypasses Vercel 4.5MB body limit)
    const { data: signedData } = await apiClient.post<{
      signedUrl: string;
      path: string;
      documentId: string;
      fileType: string;
    }>("/api/documents/signed-url", {
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    const { signedUrl, path, documentId, fileType } = signedData;
    onProgress?.(5);

    // Step 2: Upload file directly to Supabase Storage (no Vercel serverless in the path)
    // Progress mapped to 5-80% so the parsing phase has room to animate.
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) onProgress(5 + Math.round((e.loaded / e.total) * 75));
        });
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`스토리지 업로드 실패: ${xhr.status} ${xhr.responseText}`));
      };
      xhr.onerror = () => reject(new Error("스토리지 업로드 중 네트워크 오류가 발생했습니다."));
      xhr.send(file);
    });

    // Step 3: Parse text + save to DB (can take 10-30s for large files).
    // Slowly tick 80→98% so the bar visibly moves during parsing.
    onProgress?.(80);
    let fake = 80;
    const ticker = setInterval(() => {
      fake = Math.min(fake + 1, 98);
      onProgress?.(fake);
    }, 600);

    try {
      const { data: raw } = await apiClient.post<Record<string, unknown>>(
        "/api/documents/process",
        { path, documentId, filename: file.name, fileType, fileSize: file.size },
        { timeout: 300000 }
      );
      return mapDoc(raw);
    } finally {
      clearInterval(ticker);
    }
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
