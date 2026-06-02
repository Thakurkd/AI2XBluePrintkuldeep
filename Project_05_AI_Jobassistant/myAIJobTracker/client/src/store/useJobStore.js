import { create } from 'zustand';

export const useJobStore = create((set) => ({
  jobs: [],
  selectedJob: null,
  filter: 'all',

  setJobs: (jobs) => set({ jobs }),

  addJob: (job) =>
    set((state) => ({
      jobs: [job, ...state.jobs],
    })),

  updateJob: (updatedJob) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job._id === updatedJob._id ? updatedJob : job
      ),
    })),

  deleteJob: (jobId) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job._id !== jobId),
    })),

  setSelectedJob: (job) => set({ selectedJob: job }),

  setFilter: (filter) => set({ filter }),

  getJobsByStatus: (status) =>
    set((state) => {
      if (status === 'all') return state;
      return {
        jobs: state.jobs.filter((job) => job.status === status),
      };
    }),
}));
