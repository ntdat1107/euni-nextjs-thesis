import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for tokens
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('euni_access_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle logout or refresh token
    }
    return Promise.reject(error);
  }
);

export default api;
