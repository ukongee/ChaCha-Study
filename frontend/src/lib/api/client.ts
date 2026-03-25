import axios from "axios";
import { useAuthStore } from "@/lib/stores/authStore";

const apiClient = axios.create({
  baseURL: "",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터: JWT 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // AI API 키 자동 첨부
  const aiApiKey = localStorage.getItem("aiApiKey");
  if (aiApiKey) {
    config.headers["X-AI-Api-Key"] = aiApiKey;
  }

  return config;
});

// 응답 인터셉터: 401 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
