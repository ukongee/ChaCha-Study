import apiClient from "./client";
import type { ApiResponse, PageResponse } from "@/types/api.types";
import type { Post, PostCreateRequest } from "@/types/community.types";

export const communityApi = {
  getPosts: async (params?: {
    courseName?: string;
    department?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<Post>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<Post>>>("/api/community", { params });
    return res.data.data;
  },

  getPost: async (id: number): Promise<Post> => {
    const res = await apiClient.get<ApiResponse<Post>>(`/api/community/${id}`);
    return res.data.data;
  },

  createPost: async (data: PostCreateRequest): Promise<Post> => {
    const res = await apiClient.post<ApiResponse<Post>>("/api/community", data);
    return res.data.data;
  },

  likePost: async (id: number): Promise<void> => {
    await apiClient.post(`/api/community/${id}/like`);
  },
};
