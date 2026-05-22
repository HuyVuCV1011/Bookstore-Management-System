import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  withCredentials: true, // Send cookies with requests
});

// Helper to decode JWT (without verification, just for debugging)
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (e) {
    return null;
  }
}

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/books',
  '/categories',
  '/authors',
  '/publishers',
  '/cart',
  '/graph/recommendations',
  '/graph/books',
  '/graph/interactions/view',
];

// Check if URL is a public endpoint
const isPublicEndpoint = (url?: string) => {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

// Request interceptor: add access token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    // Token will be added by AuthContext
    const token = localStorage.getItem('accessToken'); // Temporary - will be in memory via Context

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      // Debug: Decode JWT to see what role is in the token
      const decoded = decodeJWT(token);
      console.log('[Axios Request]', {
        url: config.url,
        method: config.method,
        hasToken: true,
        decodedToken: decoded,
        role: decoded?.role,
        sub: decoded?.sub,
        email: decoded?.email
      });
    } else {
      // Guest users - cookies sent automatically by browser
      // No need to manually add session ID header

      if (!isPublicEndpoint(config.url)) {
        // Only warn if this is not a public endpoint
        console.warn('[Axios Request] No token found for protected endpoint:', config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401 and refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    // Only auto-refresh for non-auth endpoints (don't intercept login/register errors)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken;
        localStorage.setItem('accessToken', newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
