import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Get API base URL from environment or use relative path
const getApiBaseUrl = () => {
  // In production, use VITE_API_URL if set, otherwise use relative path
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  // Use relative path (will be proxied by vercel.json or nginx)
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Don't set Content-Type for blob requests
  if (config.responseType === 'blob') {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Don't redirect if already on login page to prevent loops
      if (currentPath !== '/login') {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

