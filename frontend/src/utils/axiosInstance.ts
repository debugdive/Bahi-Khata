import axios from 'axios';

// In production (Vercel), VITE_API_URL is the Render backend URL.
// In local dev, it's empty and the Vite proxy handles /api/* → localhost:5000.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Attach the JWT token on every request automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
