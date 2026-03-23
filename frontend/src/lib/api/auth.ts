import apiClient from "./client";
import type { ApiResponse } from "@/types/api.types";
import type { LoginRequest, SignUpRequest, TokenResponse, User } from "@/types/auth.types";

export const authApi = {
  login: async (data: LoginRequest): Promise<{ user: User; token: string }> => {
    const res = await apiClient.post<ApiResponse<{ user: User; tokenResponse: TokenResponse }>>(
      "/api/auth/login",
      data
    );
    return {
      user: res.data.data.user,
      token: res.data.data.tokenResponse.accessToken,
    };
  },

  signup: async (data: SignUpRequest): Promise<void> => {
    await apiClient.post("/api/auth/signup", data);
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>("/api/auth/me");
    return res.data.data;
  },
};
