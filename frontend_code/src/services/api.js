import axios from 'axios';

// 1. Point to the Render Backend
// This will work because the backend now accepts /api/classify AND /classify
const API_URL = "https://ahmed-geothermal-danelle.ngrok-free.dev -> http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
});

// 2. Automatically attach the Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// 3. API Calls
export const signup = (userData) => api.post('/signup', userData);
export const login = (userData) => api.post('/login', userData);
export const getProfile = () => api.get('/profile');
export const updateProfile = (data) => api.put('/profile', data);
export const getReports = () => api.get('/reports');

// --- CRITICAL FIX: No manual 'Content-Type' header here ---
// We allow axios to handle the multipart form data automatically.
export const classifyImage = (formData) => api.post('/classify', formData);