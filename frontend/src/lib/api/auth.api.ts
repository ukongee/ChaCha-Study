import apiClient from "./client";
import type { ApiResponse } from "@/types/api.types";
import type { LoginRequest, SignUpRequest, TokenResponse, User } from "@/types/auth.types";

export const authApi = {
  signUp: (data: SignUpRequest) =>
    apiClient.post<ApiResponse<User>>("/api/auth/signup", data),

  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<TokenResponse>>("/api/auth/login", data),

  getMe: () =>
    apiClient.get<ApiResponse<User>>("/api/auth/me"),
};
