import apiClient from "./client";
import type { ApiResponse, PageResponse } from "@/types/api.types";
import type { CourseReview, ReviewCreateRequest } from "@/types/community.types";

export const reviewsApi = {
  getReviews: async (params?: {
    courseName?: string;
    professorName?: string;
    department?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<CourseReview>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<CourseReview>>>("/api/reviews", {
      params,
    });
    return res.data.data;
  },

  createReview: async (data: ReviewCreateRequest): Promise<CourseReview> => {
    const res = await apiClient.post<ApiResponse<CourseReview>>("/api/reviews", data);
    return res.data.data;
  },
};
