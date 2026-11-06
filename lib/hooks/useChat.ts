import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { useHouseholdStore } from "../../store/household.store";

const HOUSEHOLD_ACTIONS = new Set([
  "create_household",
  "rename_household",
  "generate_household_invite",
  "join_household",
  "leave_household",
  "delete_household",
]);

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
  title?: string | null;
}

interface HouseholdSummary {
  currency?: string;
  year?: number;
  net_worth?: number;
  portfolio_value?: number;
  total_debt?: number;
  total_income?: number;
  total_expenses?: number;
}

interface Household {
  id: number;
  name: string;
  summary?: HouseholdSummary;
}

interface ChatPayload {
  message: string;
  history: ChatMessage[];
  year?: number;
  month?: number;
  householdId?: number;
  householdName?: string;
  households?: Household[];
}

export function useChatMutation() {
  const qc = useQueryClient();

  return useMutation<ChatResponse, Error, ChatPayload>({
    mutationFn: async ({
      householdId,
      householdName,
      households,
      ...payload
    }) => {
      // Build context message so the AI knows which household is active
      let contextContent: string;
      if (householdName) {
        contextContent = `[System context: Currently managing household "${householdName}"${householdId ? ` (id=${householdId})` : ""}. Use this household unless the user specifies a different one. IMPORTANT: Never show IDs to the user. Refer to records by their name, amount, and date (month/year) instead.]`;
      } else if (households && households.length > 0) {
        const list = households
          .map((h) => {
            const s = h.summary;
            if (!s) return `"${h.name}" (id=${h.id})`;
            const cur = s.currency ?? "USD";
            const parts = [
              s.net_worth != null ? `net worth ${cur} ${s.net_worth}` : null,
              s.portfolio_value != null
                ? `portfolio ${cur} ${s.portfolio_value}`
                : null,
              s.total_debt != null
                ? `liabilities ${cur} ${s.total_debt}`
                : null,
              s.total_income != null ? `income ${cur} ${s.total_income}` : null,
              s.total_expenses != null
                ? `expenses ${cur} ${s.total_expenses}`
                : null,
            ].filter(Boolean);
            const summaryText = parts.length
              ? ` — ${s.year ?? "current year"} totals: ${parts.join(", ")}`
              : "";
            return `"${h.name}" (id=${h.id})${summaryText}`;
          })
          .join("; ");
        contextContent = `[System context: User has the following households with their financial summaries: ${list}. These net worth/portfolio/liability figures are computed aggregates (not individual records), so answer questions about them directly from this context instead of searching for a matching record. When searching or querying individual records, search across ALL households and show results from all of them. Only ask which household to use when the user wants to ADD or REMOVE a record and hasn't specified which household. IMPORTANT: Never show IDs to the user. Refer to records by their name, amount, date (month/year), and household name instead.]`;
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
        household_id: householdId,
        households,
      });
      return res.data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["overview"] });

      const succeeded = data.actions.filter((a) => a.success);
      if (succeeded.some((a) => HOUSEHOLD_ACTIONS.has(a.action))) {
        qc.invalidateQueries({ queryKey: ["households"] });
      }

      // If the active household was deleted or left, clear it so the UI
      // navigates back to the household picker.
      const activeHouseholdRemoved =
        variables.householdId != null &&
        succeeded.some(
          (a) =>
            a.action === "delete_household" || a.action === "leave_household",
        );
      if (activeHouseholdRemoved) {
        useHouseholdStore.getState().clearActiveHousehold();
      }
    },
  });
}
