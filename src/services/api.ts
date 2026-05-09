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
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Chỉ xử lý refresh token nếu lỗi là 401 (Unauthorized) và chưa thử lại lần nào
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('euni_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Gọi API refresh token sử dụng instance axios mới để tránh loop interceptor
        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
        
        const responseData = res.data;
        if (responseData && responseData.success) {
          const { accessToken, refreshToken: newRefreshToken, tokenVersion } = responseData.data;
          
          // Lưu token mới vào localStorage
          localStorage.setItem('euni_access_token', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('euni_refresh_token', newRefreshToken);
          }
          
          // Cập nhật tokenVersion đồng bộ để tránh bị JwtAuthenticationFilter chặn
          const userStr = localStorage.getItem('euni_user');
          if (userStr && tokenVersion !== undefined) {
            const user = JSON.parse(userStr);
            user.tokenVersion = tokenVersion;
            localStorage.setItem('euni_user', JSON.stringify(user));
          }

          // Cập nhật header cho request hiện tại và thực hiện gửi lại
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error(responseData?.message || 'Refresh token failed');
        }
      } catch (refreshError) {
        // Nếu thực sự thất bại trong việc refresh (ví dụ refresh token hết hạn thật), mới logout
        console.error('Session expired, logging out...', refreshError);
        
        localStorage.removeItem('euni_access_token');
        localStorage.removeItem('euni_refresh_token');
        localStorage.removeItem('euni_user');
        
        // Tránh redirect liên tục nếu đang ở trang login
        if (!window.location.pathname.includes('/login')) {
          const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?session=expired&redirect=${redirectUrl}`;
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
