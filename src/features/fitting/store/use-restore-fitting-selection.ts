"use client";

import { useEffect } from "react";
import { useFittingSelectionStore } from "./fitting-selection-store";

export function useRestoreFittingSelection() {
  useEffect(() => {
    void useFittingSelectionStore.persist.rehydrate();
  }, []);
}
