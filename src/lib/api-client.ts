import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './store';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (typeof window !== 'undefined') {
      const status = error.response?.status;
      const data = error.response?.data;
      const message = data?.message || 'Something went wrong. Please try again.';

      if (status === 401) {
        // Clear both localStorage and Zustand store to break the loop
        useAuthStore.getState().logout();
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      } else if (status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (status === 404) {
        // Suppress toast for some 404s if needed, or show general error
        // toast.error('Requested resource not found.');
      } else if (status && status >= 500) {
        toast.error('Server error. Our team has been notified.');
      } else {
        // For other errors like 400 Bad Request
        toast.error(message);
      }
    }
    return Promise.reject(error);
  },
);
