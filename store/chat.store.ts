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
  getSessionsForHousehold: (householdId?: number) => ChatSession[];
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
            const title = s.title === "New chat" && msg.role === "user" ? generateTitle(msg.content) : s.title;
            return { ...s, messages, title, updatedAt: Date.now() };
          }),
        }));
      },

      deleteSession: (sessionId) => {
        set((state) => {
          const sessions = state.sessions.filter((s) => s.id !== sessionId);
          const activeSessionId = state.activeSessionId === sessionId ? null : state.activeSessionId;
          return { sessions, activeSessionId };
        });
      },

      clearAllSessions: () => {
        set({ sessions: [], activeSessionId: null });
      },

      /**
       * Returns sessions filtered by household context:
       * - If householdId is provided: returns sessions belonging to that household
       * - If householdId is undefined/null: returns sessions that have no household (general/all)
       * Only returns sessions that have at least one message.
       */
      getSessionsForHousehold: (householdId?: number) => {
        const { sessions } = get();
        return sessions.filter((s) => {
          if (s.messages.length === 0) return false;
          if (householdId != null) {
            return s.householdId === householdId;
          }
          // No household specified — show sessions without a specific household
          return s.householdId == null;
        });
      },
    }),
    {
      name: "kevin-chat-history",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
