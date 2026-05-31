import apiClient from './api.js';

export const jobService = {
  getAll: () => apiClient.get('/jobs'),
  getById: (id) => apiClient.get(`/jobs/${id}`),
  create: (jobData) => apiClient.post('/jobs', jobData),
  update: (id, jobData) => apiClient.put(`/jobs/${id}`, jobData),
  delete: (id) => apiClient.delete(`/jobs/${id}`),
  updateStatus: (id, status) =>
    apiClient.patch(`/jobs/${id}/status`, { status }),
};
