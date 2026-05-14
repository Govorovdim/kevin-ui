import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { storage } from "./storage";
import { useAuthStore } from "../store/auth.store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Refresh token interceptor ─────────────────────────────────────────────────

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401 and if we haven't already retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh if the failing request was itself a refresh or login
    const url = originalRequest.url ?? "";
    if (url.includes("/auth/refresh") || url.includes("/auth/login")) {
      await clearAuthState();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another refresh is already in progress — queue this request
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          originalRequest._retry = true;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const refreshToken = await storage.getItem("refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
        refresh_token: refreshToken,
      });

      // Store new tokens
      await storage.setItem("access_token", data.access_token);
      await storage.setItem("refresh_token", data.refresh_token);
      useAuthStore.getState().setToken(data.access_token);

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

      // Notify queued requests
      onTokenRefreshed(data.access_token);

      return api(originalRequest);
    } catch {
      await clearAuthState();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

async function clearAuthState() {
  await storage.deleteItem("access_token");
  await storage.deleteItem("refresh_token");
  useAuthStore.getState().clearToken();
}
