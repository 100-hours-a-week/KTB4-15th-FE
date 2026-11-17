import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  fittingCandidateSchema,
  type FittingCandidate,
} from "../schema/fitting-candidate";

type FittingSelectionState = {
  selectedForDelete: Map<number, FittingCandidate>;
  setSelectedForDelete: (
    update:
      | Map<number, FittingCandidate>
      | ((
          current: Map<number, FittingCandidate>,
        ) => Map<number, FittingCandidate>),
  ) => void;
  top: FittingCandidate | null;
  bottom: FittingCandidate | null;
  clearSelection: () => void;
  selectProduct: (product: FittingCandidate) => void;
  clearProduct: (itemType: FittingCandidate["itemType"]) => void;
};

export const useFittingSelectionStore = create<FittingSelectionState>()(
  persist(
    (set) => ({
      selectedForDelete: new Map(),
      setSelectedForDelete: (update) =>
        set((state) => ({
          selectedForDelete:
            typeof update === "function"
              ? update(state.selectedForDelete)
              : update,
        })),
      top: null,
      bottom: null,
      clearSelection: () =>
        set({ top: null, bottom: null, selectedForDelete: new Map() }),
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
      partialize: ({ top, bottom, selectedForDelete }) => ({
        top,
        bottom,
        selectedForDelete: [...selectedForDelete.values()],
      }),
      merge: (persisted, current) => {
        const saved = persisted as
          | Partial<{
              top: FittingCandidate;
              bottom: FittingCandidate;
              selectedForDelete: unknown;
            }>
          | undefined;
        const selection = fittingCandidateSchema
          .array()
          .safeParse(saved?.selectedForDelete);
        return {
          ...current,
          top: saved?.top ?? null,
          bottom: saved?.bottom ?? null,
          selectedForDelete: selection.success
            ? new Map(
                selection.data.map((product) => [
                  product.fittingCandidateId,
                  product,
                ]),
              )
            : new Map(),
        };
      },
      skipHydration: true,
    },
  ),
);

export function clearFittingSelection() {
  useFittingSelectionStore.getState().clearSelection();
  useFittingSelectionStore.persist.clearStorage();
}
