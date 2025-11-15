import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized) - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth functions
export const login = async (email: string, password: string) => {
  const response = await api.post('/api/login', { email, password });
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  return response.data;
};

export const register = async (email: string, password: string, name: string) => {
  const response = await api.post('/api/register', { email, password, name });
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Employee API functions
export const getEmployees = async () => {
  const response = await api.get('/api/employees');
  return response.data;
};

export const getEmployee = async (id: number) => {
  const response = await api.get(`/api/employees/${id}`);
  return response.data;
};

export const createEmployee = async (data: { name: string; email: string }) => {
  const response = await api.post('/api/employees', data);
  return response.data;
};

export const updateEmployee = async (id: number, data: { name?: string; email?: string }) => {
  const response = await api.put(`/api/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id: number) => {
  const response = await api.delete(`/api/employees/${id}`);
  return response.data;
};
