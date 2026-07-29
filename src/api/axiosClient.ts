/**
 * Axios HTTP client configured for the Gulliver API.
 * - Base URL: http://localhost:8001/api/v1
 * - Auto-attaches JWT token from localStorage
 * - Auto-handles 401 responses (logout)
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ── Request interceptor: attach JWT token ─────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gulliver_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 (auto-logout) ────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gulliver_token');
      localStorage.removeItem('gulliver_auth_session');
      // Optionally reload to force re-login
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
