import axios from "axios";

const apiClient = axios.create({
  baseURL: "",
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터: CNU AI API 키 자동 첨부 (서버에 저장 안 함)
apiClient.interceptors.request.use((config) => {
  const aiApiKey = localStorage.getItem("aiApiKey");
  if (aiApiKey) {
    config.headers["X-AI-Api-Key"] = aiApiKey;
  }
  return config;
});

// 응답 인터셉터: 401 → 로그인으로
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
