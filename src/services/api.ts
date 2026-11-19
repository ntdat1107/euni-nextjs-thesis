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
    refreshSubscribers = [];
    localStorage.removeItem('euni_access_token');
    localStorage.removeItem('euni_refresh_token');
    localStorage.removeItem('euni_user');

    if (!window.location.pathname.includes('/login')) {
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?session=expired&redirect=${redirectUrl}`;
    }
  }
};

const syncUserTokenVersion = (tokenVersion?: number) => {
  if (tokenVersion === undefined) return;
  const userStr = localStorage.getItem('euni_user');
  if (!userStr) return;
  try {
    const user = JSON.parse(userStr);
    user.tokenVersion = tokenVersion;
    localStorage.setItem('euni_user', JSON.stringify(user));
  } catch (e) {}
};

const showForbiddenModal = (messageText?: string) => {
  if (typeof window === 'undefined') return;
  Modal.error({
    title: 'Truy cập bị từ chối (403)',
    content: messageText || 'Bạn không có quyền thực hiện hành động này.',
    okText: 'Về trang chủ',
    onOk: () => {
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
  });
};

const refreshAndRetry = async (
  originalRequest: InternalAxiosRequestConfig & { _retry?: boolean }
): Promise<any> => {
  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const refreshToken = localStorage.getItem('euni_refresh_token');
    if (!refreshToken) {
      handleLogout();
      return new Promise(() => {});
    }

    const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
    const resData = res.data;
    const dataPayload = resData?.data || resData;
    const accessToken = dataPayload?.accessToken;

    if (!accessToken) {
      handleLogout();
      return new Promise(() => {});
    }

    localStorage.setItem('euni_access_token', accessToken);
    if (dataPayload.refreshToken) {
      localStorage.setItem('euni_refresh_token', dataPayload.refreshToken);
    }

    syncUserTokenVersion(dataPayload.tokenVersion);

    if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
    }

    onRefreshed(accessToken);
    return apiClient(originalRequest);
  } catch (refreshError) {
    handleLogout();
    return new Promise(() => {});
  } finally {
    isRefreshing = false;
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
    if (response.data && typeof response.data.success === 'boolean') {
      if (response.data.success) {
        return response.data.data;
      }
      const code = response.data.code;
      if (code === 'UNAUTHORIZED' || code === 'TOKEN_EXPIRED') {
        handleLogout();
        return new Promise(() => {});
      }
      return Promise.reject(new Error(response.data.message || 'Operation failed'));
    }
    return response.data;
  },
  async (error: AxiosError) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (isLogoutInProgress) {
      return new Promise(() => {});
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const responseData = error.response?.data as any;

    if (originalRequest?.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    const isUnauthorized =
      error.response?.status === 401 ||
      responseData?.code === 'UNAUTHORIZED' ||
      responseData?.code === 'TOKEN_EXPIRED';

    if (isUnauthorized && typeof window !== 'undefined') {
      if (originalRequest?.url?.includes('/auth/refresh-token') || originalRequest?._retry) {
        handleLogout();
        return new Promise(() => {});
      }

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

      return refreshAndRetry(originalRequest);
    }

    if (error.response?.status === 403 || responseData?.code === 'FORBIDDEN') {
      showForbiddenModal(responseData?.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Universal fetch wrapper for streaming API calls (SSE / ReadableStream).
 */
export async function fetchWithTokenRefresh(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (isLogoutInProgress) {
    return new Promise(() => {});
  }

  const getAuthHeader = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('euni_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const initialHeaders: Record<string, string> = {
    ...getAuthHeader(),
    ...((options.headers as Record<string, string>) || {}),
  };

  let response = await fetch(url, { ...options, headers: initialHeaders });

  if (response.status === 401 && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('euni_refresh_token');
    if (!refreshToken) {
      handleLogout();
      return new Promise(() => {});
    }

    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const refreshData = await refreshRes.json();
      const dataPayload = refreshData.data || refreshData;
      const newAccessToken = dataPayload?.accessToken;

      if (!newAccessToken) {
        handleLogout();
        return new Promise(() => {});
      }

      localStorage.setItem('euni_access_token', newAccessToken);
      if (dataPayload.refreshToken) {
        localStorage.setItem('euni_refresh_token', dataPayload.refreshToken);
      }

      const retryHeaders: Record<string, string> = {
        ...((options.headers as Record<string, string>) || {}),
        Authorization: `Bearer ${newAccessToken}`,
      };
      response = await fetch(url, { ...options, headers: retryHeaders });
    } catch (err) {
      handleLogout();
      return new Promise(() => {});
    }
  }

  return response;
}
