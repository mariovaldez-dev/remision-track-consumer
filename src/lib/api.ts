import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Adjuntar token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejar errores HTTP globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token inválido o expirado → limpiar sesión y mandar al login
      localStorage.removeItem('access_token');
      if (!globalThis.location.pathname.includes('/login')) {
        globalThis.location.href = '/login';
      }
    }
    // 403 se propaga tal cual — cada vista lo maneja con su propio toast

    return Promise.reject(error);
  },
);
