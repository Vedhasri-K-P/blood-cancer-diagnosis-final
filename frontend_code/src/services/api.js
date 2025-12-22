import axios from 'axios';

// 1. Point to the Render Backend (with /api)
const API_URL = "https://smart-diagnostic-tool.onrender.com/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Automatically attach the Token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Grab token from storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 3. Define the API calls clearly
export const signup = (userData) => api.post('/signup', userData);
export const login = (userData) => api.post('/login', userData);
export const getProfile = () => api.get('/profile');
export const saveProfile = updateProfile;
export const updateProfile = (data) => api.put('/profile', data);
export const classifyImage = (formData) => api.post('/classify', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getReports = () => api.get('/reports');