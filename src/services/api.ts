import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Modal } from 'antd';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
let isLogoutInProgress = false;

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

const handleLogout = () => {
  if (typeof window !== 'undefined' && !isLogoutInProgress) {
    isLogoutInProgress = true;
    localStorage.removeItem('euni_access_token');
    localStorage.removeItem('euni_refresh_token');
    localStorage.removeItem('euni_user');

    if (!window.location.pathname.includes('/login')) {
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?session=expired&redirect=${redirectUrl}`;
    }
  }
};

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
    const responseData = error.response?.data as any;

    if (isLogoutInProgress) {
      return Promise.reject(error);
    }

    // Check if error is related to Token Expiration / Unauthorized
    const isUnauthorized = 
      error.response?.status === 401 || 
      responseData?.code === 'UNAUTHORIZED' || 
      responseData?.code === 'TOKEN_EXPIRED';

    if (isUnauthorized && typeof window !== 'undefined') {
      // If it's the refresh token endpoint itself that failed, logout immediately
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        handleLogout();
        return Promise.reject(error);
      }

      // If this request already retried once and failed again, logout
      if (originalRequest._retry) {
        handleLogout();
        return Promise.reject(error);
      }

      // If refresh token request is already in-flight, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('euni_refresh_token');
        if (!refreshToken) {
          handleLogout();
          return Promise.reject(error);
        }

        // Call backend refresh token API
        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
        const resData = res.data;

        if (resData && (resData.success || resData.accessToken)) {
          const dataPayload = resData.data || resData;
          const { accessToken, refreshToken: newRefreshToken, tokenVersion } = dataPayload;

          if (!accessToken) {
            handleLogout();
            return Promise.reject(error);
          }

          localStorage.setItem('euni_access_token', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('euni_refresh_token', newRefreshToken);
          }

          // Sync tokenVersion in euni_user if available
          const userStr = localStorage.getItem('euni_user');
          if (userStr && tokenVersion !== undefined) {
            try {
              const user = JSON.parse(userStr);
              user.tokenVersion = tokenVersion;
              localStorage.setItem('euni_user', JSON.stringify(user));
            } catch (e) {}
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          onRefreshed(accessToken);
          return apiClient(originalRequest);
        } else {
          handleLogout();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden (Permission Denied)
    if (error.response?.status === 403 || responseData?.code === 'FORBIDDEN') {
      if (typeof window !== 'undefined') {
        const msg = responseData?.message || 'Bạn không có quyền thực hiện hành động này.';

        Modal.error({
          title: 'Truy cập bị từ chối (403)',
          content: msg,
          okText: 'Về trang chủ',
          onOk: () => {
            if (window.location.pathname !== '/') {
              window.location.href = '/';
            }
          }
        });
      }
    }

    return Promise.reject(error);
  }
);
