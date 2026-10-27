import axios, { AxiosError, type AxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// The access token lives in memory only. The refresh cookie restores it after a page reload.
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export interface SessionUser {
  user_id: string;
  email: string;
  full_name: string;
}

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends the httpOnly refresh cookie
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Requests that must never trigger a refresh
const NO_REFRESH_URLS = [
  "/auth/token",
  "/auth/refresh",
  "/auth/logout",
  "/auth/signup",
];

type RetryableRequest = AxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<SessionUser> | null = null;

// One shared refresh call. Your backend rotates refresh tokens and treats a reused
// one as theft, so two refreshes at the same time would log the user out.
const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access_token: string; user: SessionUser }>(
        `${BASE_URL}/auth/refresh`,
        null,
        { withCredentials: true },
      )
      .then(({ data }) => {
        setAccessToken(data.access_token);
        return data.user;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

export async function restoreSession(): Promise<SessionUser | null> {
  try {
    return await refreshSession();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequest | undefined;

    const shouldRefresh =
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !NO_REFRESH_URLS.some((url) => original.url?.startsWith(url));

    if (!shouldRefresh || !original) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      await refreshSession();
      return api(original); // the request interceptor adds the new token
    } catch (refreshError) {
    setAccessToken(null);
    window.dispatchEvent(new Event("auth:expired"));
    return Promise.reject(refreshError);
    }
  },
);

export default api;