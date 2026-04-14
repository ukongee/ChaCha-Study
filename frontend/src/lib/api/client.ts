import axios from "axios";
import { getStoredApiKey } from "@/hooks/useApiKey";

const apiClient = axios.create({
  baseURL: "",
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

// Attach API key on every request.
// user_id is NEVER sent by the client — resolved server-side from api_key.
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
