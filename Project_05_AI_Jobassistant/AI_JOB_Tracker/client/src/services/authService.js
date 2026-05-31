import apiClient from './api.js';

export const authService = {
  register: (name, email, password) =>
    apiClient.post('/auth/register', { name, email, password }),

  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  getMe: () => apiClient.get('/auth/me'),
};
