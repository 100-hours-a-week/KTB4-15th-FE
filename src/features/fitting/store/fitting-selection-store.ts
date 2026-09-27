import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FittingCandidate } from "../schema/fitting-candidate";

type FittingSelectionState = {
  top: FittingCandidate | null;
  bottom: FittingCandidate | null;
  clearSelection: () => void;
  selectProduct: (product: FittingCandidate) => void;
  clearProduct: (itemType: FittingCandidate["itemType"]) => void;
};

export const useFittingSelectionStore = create<FittingSelectionState>()(
  persist(
    (set) => ({
      top: null,
      bottom: null,
      clearSelection: () => set({ top: null, bottom: null }),
      selectProduct: (product) =>
        set(
          product.itemType === "TOP" ? { top: product } : { bottom: product },
        ),
      clearProduct: (itemType) =>
        set(itemType === "TOP" ? { top: null } : { bottom: null }),
    }),
    {
      name: "fitting-selection",
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ top, bottom }) => ({ top, bottom }),
      skipHydration: true,
    },
  ),
);

export function clearFittingSelection() {
  useFittingSelectionStore.getState().clearSelection();
  useFittingSelectionStore.persist.clearStorage();
}
