import axios from "axios";

const apiClient = axios.create({
  baseURL: "",
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

// Attach user's API key from localStorage on every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const key = localStorage.getItem("cnu_ai_api_key");
    if (key) config.headers["X-AI-Api-Key"] = key;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default apiClient;
