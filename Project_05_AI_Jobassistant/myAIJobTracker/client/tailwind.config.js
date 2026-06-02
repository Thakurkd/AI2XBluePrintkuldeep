module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0f1e',
        card: 'rgba(255, 255, 255, 0.05)',
        primary: '#6366f1',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        textPrimary: '#f1f5f9',
        textMuted: '#94a3b8',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      backdropFilter: {
        blur: 'blur(12px)',
      },
    },
  },
  plugins: [],
};
