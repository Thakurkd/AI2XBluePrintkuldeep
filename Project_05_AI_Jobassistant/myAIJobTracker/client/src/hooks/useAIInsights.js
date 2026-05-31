export const useAIInsights = () => {
  const generateInsights = (jobs) => {
    const totalJobs = jobs.length;
    const applied = jobs.filter((j) => j.status === 'applied').length;
    const avgMatchScore =
      totalJobs > 0
        ? Math.round(jobs.reduce((sum, j) => sum + j.aiMatchScore, 0) / totalJobs)
        : 0;

    return {
      totalJobs,
      applied,
      avgMatchScore,
      successRate: totalJobs > 0 ? Math.round((applied / totalJobs) * 100) : 0,
    };
  };

  return { generateInsights };
};
