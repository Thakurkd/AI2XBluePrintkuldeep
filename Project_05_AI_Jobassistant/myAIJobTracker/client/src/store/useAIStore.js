import { create } from 'zustand';

export const useAIStore = create((set) => ({
  insights: null,
  isAnalyzing: false,
  chatMessages: [],
  interviewQuestions: [],

  setInsights: (insights) => set({ insights }),

  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),

  setChatMessages: (messages) => set({ chatMessages: messages }),

  setInterviewQuestions: (questions) => set({ interviewQuestions: questions }),

  clearChat: () => set({ chatMessages: [] }),
}));
