import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('euni_access_token');
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

// Add a response interceptor to handle errors and ApiResponse wrapper
apiClient.interceptors.response.use(
  (response) => {
    // If our backend returns ApiResponse { success: boolean, data: any, message: string }
    if (response.data && typeof response.data.success === 'boolean') {
      if (response.data.success) {
        return response.data.data;
      } else {
        return Promise.reject(new Error(response.data.message || 'Operation failed'));
      }
    }
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('euni_refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
          if (res.data && res.data.success) {
            const { accessToken, refreshToken: newRefreshToken, tokenVersion } = res.data.data;
            localStorage.setItem('euni_access_token', accessToken);
            if (newRefreshToken) localStorage.setItem('euni_refresh_token', newRefreshToken);
            
            // Cập nhật lại user nếu tokenVersion có thay đổi
            const userStr = localStorage.getItem('euni_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.tokenVersion = tokenVersion;
                localStorage.setItem('euni_user', JSON.stringify(user));
            }

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh token failed
        localStorage.removeItem('euni_access_token');
        localStorage.removeItem('euni_refresh_token');
        localStorage.removeItem('euni_user');
        const redirectUrl = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?session=expired&redirect=${redirectUrl}`;
        return Promise.reject(refreshError);
      }

      // No refresh token available
      localStorage.removeItem('euni_access_token');
      localStorage.removeItem('euni_refresh_token');
      localStorage.removeItem('euni_user');
      const redirectUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?session=expired&redirect=${redirectUrl}`;
    }

    const message = (error.response?.data as any)?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);
