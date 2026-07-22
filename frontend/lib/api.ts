import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request: attach JWT & Idempotency headers for mutations
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  const method = config.method?.toUpperCase();
  if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (!config.headers['Idempotency-Key']) {
      const idempKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'idemp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      config.headers['Idempotency-Key'] = idempKey;
    }
    if (!config.headers['x-client-mutation-id']) {
      config.headers['x-client-mutation-id'] = config.headers['Idempotency-Key'];
    }
  }

  return config;
});

// Response: auto-refresh on 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          },
        );
        localStorage.setItem('access_token', data.access_token);
        processQueue(null, data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);
