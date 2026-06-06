import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  householdId?: number;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  createSession: (householdId?: number) => string;
  setActiveSession: (id: string | null) => void;
  addMessage: (sessionId: string, msg: ChatMessage) => void;
  deleteSession: (sessionId: string) => void;
  clearAllSessions: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function generateTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim();
  if (trimmed.length <= 40) return trimmed;
  return trimmed.slice(0, 40) + "…";
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,

      createSession: (householdId) => {
        const id = generateId();
        const session: ChatSession = {
          id,
          title: "New chat",
          householdId,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: id,
        }));
        return id;
      },

      setActiveSession: (id) => {
        set({ activeSessionId: id });
      },

      addMessage: (sessionId, msg) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            const messages = [...s.messages, msg];
            // Auto-title from first user message
            const title =
              s.title === "New chat" && msg.role === "user"
                ? generateTitle(msg.content)
                : s.title;
            return { ...s, messages, title, updatedAt: Date.now() };
          }),
        }));
      },

      deleteSession: (sessionId) => {
        set((state) => {
          const sessions = state.sessions.filter((s) => s.id !== sessionId);
          const activeSessionId =
            state.activeSessionId === sessionId ? null : state.activeSessionId;
          return { sessions, activeSessionId };
        });
      },

      clearAllSessions: () => {
        set({ sessions: [], activeSessionId: null });
      },
    }),
    {
      name: "kevin-chat-history",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
