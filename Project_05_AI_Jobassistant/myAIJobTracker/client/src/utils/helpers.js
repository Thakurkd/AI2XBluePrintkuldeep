export const helpers = {
  formatDate: (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  daysAgo: (date) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  },

  getStatusColor: (status) => {
    const colors = {
      wishlist: 'bg-gray-500',
      applied: 'bg-blue-500',
      screening: 'bg-yellow-500',
      interviews: 'bg-purple-500',
      offer: 'bg-green-500',
      closed: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  },

  getStatusIcon: (status) => {
    const icons = {
      wishlist: '🔖',
      applied: '📤',
      screening: '🔍',
      interviews: '🎯',
      offer: '💼',
      closed: '❌',
    };
    return icons[status] || '📌';
  },
};
