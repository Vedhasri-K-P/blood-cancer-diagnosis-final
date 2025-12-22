import axios from 'axios';

// 1. Point to the Render Backend
const API_URL = "https://smart-diagnostic-tool.onrender.com/api";

export const api = axios.create({
  baseURL: API_URL,
  // DO NOT set Content-Type here globally for JSON. Let Axios handle it.
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

// --- THE FIX IS HERE ---
// We do NOT manually set 'Content-Type'. We let Axios/Browser detect the FormData.
export const classifyImage = (formData) => api.post('/classify', formData);