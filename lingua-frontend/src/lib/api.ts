import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically add JWT auth token to all requests if present
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global errors (e.g., token expiration, server error formats)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the error response conforms to our global HttpExceptionFilter format
    const errorMessage =
      error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau!';
    
    // Log warning for debug
    console.warn(`[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, errorMessage);

    if (error.response?.status === 401) {
      // Handle auto logout on 401 Unauthorized (e.g. invalid/expired token)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // We can redirect to login page if we are not already on it
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(new Error(errorMessage));
  }
);
