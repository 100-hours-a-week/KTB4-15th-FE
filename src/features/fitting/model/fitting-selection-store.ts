import { create } from "zustand";
import type { FittingCandidate } from "../schema/fitting-candidate";

type FittingSelectionState = {
  top: FittingCandidate | null;
  bottom: FittingCandidate | null;
  selectProduct: (product: FittingCandidate) => void;
  clearProduct: (itemType: FittingCandidate["itemType"]) => void;
};

export const useFittingSelectionStore = create<FittingSelectionState>(
  (set) => ({
    top: null,
    bottom: null,
    selectProduct: (product) =>
      set(product.itemType === "TOP" ? { top: product } : { bottom: product }),
    clearProduct: (itemType) =>
      set(itemType === "TOP" ? { top: null } : { bottom: null }),
  }),
);
