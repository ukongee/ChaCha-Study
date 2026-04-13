import axios from "axios";
import { getStoredApiKey } from "@/hooks/useApiKey";

const apiClient = axios.create({
  baseURL: "",
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

// Attach user's API key on every request (localStorage + memory fallback)
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const key = getStoredApiKey();
    if (key) config.headers["X-AI-Api-Key"] = key;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default apiClient;
