"use client";

import { OverlayProvider } from "overlay-kit";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <OverlayProvider>{children}</OverlayProvider>;
}
