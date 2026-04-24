import axios, { AxiosRequestConfig } from 'axios';
import { TokenManager } from '../auth/TokenManager';
import { AuthService } from '../auth/AuthService';

const BASE_URL = process.env.API_BASE_URL ?? '';

const ApiClient = axios.create({ baseURL: BASE_URL });

// Attach access token to every request
ApiClient.interceptors.request.use(async (config) => {
  const token = await TokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401: attempt silent refresh once, then retry
ApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: AxiosRequestConfig & { _retried?: boolean } =
      error.config;

    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;
      try {
        const newToken = await AuthService.refreshAccessToken();
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return ApiClient(originalRequest);
      } catch {
        // Refresh token expired — force logout
        await AuthService.logout();
      }
    }

    return Promise.reject(error);
  },
);

export default ApiClient;
