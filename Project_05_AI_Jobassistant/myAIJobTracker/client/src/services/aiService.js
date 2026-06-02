import apiClient from './api.js';

export const aiService = {
  analyzeResume: (resumeText) =>
    apiClient.post('/ai/analyze-resume', { resumeText }),

  generateCoverLetter: (jobTitle, company) =>
    apiClient.post('/ai/cover-letter', { jobTitle, company }),

  generateInterviewPrep: (jobTitle, company) =>
    apiClient.post('/ai/interview-prep', { jobTitle, company }),

  chat: (messages) => apiClient.post('/ai/chat', { messages }),

  getInsights: () => apiClient.get('/ai/insights'),
};
