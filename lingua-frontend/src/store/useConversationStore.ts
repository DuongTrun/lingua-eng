import { create } from 'zustand';
import { api } from '@/lib/api';

export interface GrammarFeedback {
  isCorrect: boolean;
  issues: string[];
  suggestion: string;
}

export interface ConversationMessage {
  id: string;
  sessionId: string;
  sender: 'USER' | 'AI';
  text: string;
  grammarFeedback?: string; // Stored as JSON string in DB
  createdAt: string;
}

export interface ConversationReport {
  id: string;
  sessionId: string;
  scoreGrammar: number;
  scoreVocabulary: number;
  scoreFluency: number;
  scoreRelevance: number;
  feedbackStrength: string;
  feedbackImprovement: string;
  createdAt: string;
}

export interface ConversationSession {
  id: string;
  userId: string;
  scenario: string;
  level: string;
  status: 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  messages?: ConversationMessage[];
  report?: ConversationReport | null;
}

interface ConversationState {
  activeSession: ConversationSession | null;
  messages: ConversationMessage[];
  history: ConversationSession[];
  currentReport: ConversationReport | null;
  isLoading: boolean;
  error: string | null;

  startSession: (scenario: string, level: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  endSession: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchSessionDetails: (sessionId: string) => Promise<void>;
  resetActiveSession: () => void;
  setError: (error: string | null) => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  activeSession: null,
  messages: [],
  history: [],
  currentReport: null,
  isLoading: false,
  error: null,

  setError: (error) => set({ error }),

  startSession: async (scenario, level) => {
    set({ isLoading: true, error: null, currentReport: null, messages: [] });
    try {
      const response = await api.post('/conversations/session', { scenario, level });
      const { session, welcomeMessage } = response.data;
      
      set({
        activeSession: session,
        messages: [welcomeMessage],
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể bắt đầu phiên hội thoại.';
      set({ 
        isLoading: false, 
        error: msg
      });
      throw err;
    }
  },

  sendMessage: async (text) => {
    const { activeSession, messages } = get();
    if (!activeSession) return;

    // Local echo for User message
    const tempUserMessage: ConversationMessage = {
      id: `temp-${Date.now()}`,
      sessionId: activeSession.id,
      sender: 'USER',
      text,
      createdAt: new Date().toISOString(),
    };

    set({ 
      messages: [...messages, tempUserMessage],
      isLoading: true,
      error: null 
    });

    try {
      const response = await api.post('/conversations/message', {
        sessionId: activeSession.id,
        text,
      });

      const { aiMessage, grammarFeedback } = response.data;

      // Update user message with grammar feedback, and append AI response
      set((state) => {
        const updatedMessages = state.messages.map((msg) => {
          if (msg.id === tempUserMessage.id) {
            return {
              ...msg,
              id: msg.id.startsWith('temp-') ? `user-${Date.now()}` : msg.id, // replace temporary id
              grammarFeedback: JSON.stringify(grammarFeedback),
            };
          }
          return msg;
        });

        return {
          messages: [...updatedMessages, aiMessage],
          isLoading: false,
        };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi gửi tin nhắn.';
      set({ 
        isLoading: false, 
        error: msg 
      });
      throw err;
    }
  },

  endSession: async () => {
    const { activeSession } = get();
    if (!activeSession) return;

    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/conversations/session/${activeSession.id}/end`);
      const report = response.data;

      set({
        currentReport: report,
        activeSession: {
          ...activeSession,
          status: 'COMPLETED',
        },
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi kết thúc phiên hội thoại.';
      set({ 
        isLoading: false, 
        error: msg 
      });
      throw err;
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/conversations/history');
      set({ history: response.data, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải lịch sử.';
      set({ 
        isLoading: false, 
        error: msg 
      });
    }
  },

  fetchSessionDetails: async (sessionId) => {
    set({ isLoading: true, error: null, currentReport: null });
    try {
      const response = await api.get(`/conversations/session/${sessionId}`);
      const session = response.data;
      
      set({
        activeSession: session,
        messages: session.messages || [],
        currentReport: session.report || null,
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải chi tiết cuộc hội thoại.';
      set({ 
        isLoading: false, 
        error: msg 
      });
      throw err;
    }
  },

  resetActiveSession: () => {
    set({
      activeSession: null,
      messages: [],
      currentReport: null,
      error: null,
    });
  },
}));
