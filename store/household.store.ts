import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Household } from "../lib/types";

interface HouseholdState {
  activeHousehold: Household | null;
  _hasHydrated: boolean;
  setActiveHousehold: (household: Household) => void;
  clearActiveHousehold: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set) => ({
      activeHousehold: null,
      _hasHydrated: false,
      setActiveHousehold: (household) => set({ activeHousehold: household }),
      clearActiveHousehold: () => set({ activeHousehold: null }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "kevin-active-household",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({ activeHousehold: state.activeHousehold }),
    },
  ),
);
