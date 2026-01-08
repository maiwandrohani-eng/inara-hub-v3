import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Get API base URL from environment or use relative path
const getApiBaseUrl = () => {
  // Always use relative path in production (works with any domain)
  // VITE_API_URL should only be used for development or if frontend/backend are on different domains
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  
  // If we're on the same domain (production), use relative path to avoid CORS issues
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    // If VITE_API_URL is set but points to a different domain, use it
    // Otherwise, use relative path
    if (envUrl && !envUrl.includes(currentOrigin)) {
      // Different domain - use the env URL
      return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    }
    // Same domain or no env URL - use relative path (avoids CORS)
    return '/api';
  }
  
  // Fallback for SSR or edge cases
  return envUrl || '/api';
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
    // Log 403 errors with more details for debugging
    if (error.response?.status === 403) {
      const errorData = error.response?.data;
      console.error('🚫🚫🚫 403 FORBIDDEN ERROR 🚫🚫🚫');
      console.error('Full Error Response:', error.response?.data);
      console.error('Error Details:', {
        message: errorData?.message,
        detail: errorData?.detail,
        requiredRoles: errorData?.requiredRoles,
        userRole: errorData?.userRole,
        userRoleType: errorData?.userRoleType,
        userEmail: errorData?.userEmail,
        userId: errorData?.userId,
        url: error.config?.url,
        method: error.config?.method,
      });
      
      // Show user-friendly alert with details
      const user = useAuthStore.getState().user;
      console.error('=== CLIENT-SIDE ROLE ===');
      console.error('Stored Role:', user?.role);
      console.error('Stored Email:', user?.email);
      console.error('=== SERVER-SIDE ROLE ===');
      console.error('Server Sees Role:', errorData?.userRole);
      console.error('Server Sees Role Type:', errorData?.userRoleType);
      console.error('Required Roles:', errorData?.requiredRoles);
      
      if (user?.role !== errorData?.userRole) {
        console.error('⚠️⚠️⚠️ ROLE MISMATCH DETECTED ⚠️⚠️⚠️');
        console.error('Client shows:', user?.role);
        console.error('Server shows:', errorData?.userRole);
        console.error('💡 SOLUTION: Log out and log back in to refresh your token');
      }
      console.error('🚫🚫🚫 END 403 ERROR 🚫🚫🚫');
    }
    return Promise.reject(error);
  }
);

export default api;

