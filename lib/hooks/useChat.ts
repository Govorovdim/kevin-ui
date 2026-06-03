import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ActionResult {
  action: string;
  success: boolean;
  detail: string;
}

export interface ChatResponse {
  message: string;
  actions: ActionResult[];
}

interface Household {
  id: number;
  name: string;
}

interface ChatPayload {
  message: string;
  history: ChatMessage[];
  year?: number;
  month?: number;
  householdName?: string;
  households?: Household[];
}

export function useChatMutation() {
  const qc = useQueryClient();

  return useMutation<ChatResponse, Error, ChatPayload>({
    mutationFn: async ({ householdName, households, ...payload }) => {
      // Prepend household context to history so the AI knows which household is active
      let contextContent: string;
      if (householdName) {
        contextContent = `[System context: Currently managing household "${householdName}". Use this household unless the user specifies a different one. IMPORTANT: Never show IDs to the user. Refer to records by their name, amount, and date (month/year) instead.]`;
      } else if (households && households.length > 0) {
        const list = households.map((h) => `"${h.name}" (id=${h.id})`).join(", ");
        contextContent = `[System context: User has the following households: ${list}. When searching or querying records, search across ALL households and show results from all of them. Only ask which household to use when the user wants to ADD or REMOVE a record and hasn't specified which household. IMPORTANT: Never show IDs to the user. Refer to records by their name, amount, date (month/year), and household name instead.]`;
      } else {
        contextContent = `[System context: No household selected.]`;
      }
      const contextMsg: ChatMessage = {
        role: "user",
        content: contextContent,
      };
      const historyWithContext = [contextMsg, ...payload.history];
      const res = await api.post("/api/v1/chat/", {
        ...payload,
        history: historyWithContext,
      });
      return res.data;
    },
    onSuccess: (data) => {
      // If actions were performed, invalidate all data queries so the page refreshes
      if (data.actions && data.actions.length > 0) {
        qc.invalidateQueries();
      }
    },
  });
}
