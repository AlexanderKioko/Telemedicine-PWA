import axios, { AxiosError } from 'axios'; // Import AxiosError

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If 401 error and it's not a retry request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        await api.post('/api/refresh-token');
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user
        await api.post('/api/logout');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export type TestMessageResponse = {
  message: string;
};

export const fetchTestMessage = async (): Promise<TestMessageResponse> => {
  const res = await api.get('/api/test');
  return res.data;
};

export { AxiosError }; // Export AxiosError
export default api;