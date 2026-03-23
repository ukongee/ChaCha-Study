import apiClient from "./client";
import type { AxiosResponse } from "axios";
import type { ApiResponse } from "@/types/api.types";
import type { LoginRequest, SignUpRequest, TokenResponse, User } from "@/types/auth.types";

export const authApi = {
  login: (data: LoginRequest): Promise<AxiosResponse<ApiResponse<TokenResponse>>> => {
    return apiClient.post<ApiResponse<TokenResponse>>("/api/auth/login", data);
  },

  signUp: (data: SignUpRequest): Promise<AxiosResponse<ApiResponse<void>>> => {
    return apiClient.post<ApiResponse<void>>("/api/auth/signup", data);
  },

  getMe: (): Promise<AxiosResponse<ApiResponse<User>>> => {
    return apiClient.get<ApiResponse<User>>("/api/auth/me");
  },
};
