import { create } from "zustand";
import type { Household } from "../lib/types";

interface HouseholdState {
  activeHousehold: Household | null;
  setActiveHousehold: (household: Household) => void;
  clearActiveHousehold: () => void;
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  activeHousehold: null,
  setActiveHousehold: (household) => set({ activeHousehold: household }),
  clearActiveHousehold: () => set({ activeHousehold: null }),
}));
