"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type NavigationVisibilityContextValue = {
  isNavigationVisible: boolean;
  setIsNavigationVisible: Dispatch<SetStateAction<boolean>>;
};

const NavigationVisibilityContext =
  createContext<NavigationVisibilityContextValue | null>(null);

export function NavigationVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);

  return (
    <NavigationVisibilityContext.Provider
      value={{ isNavigationVisible, setIsNavigationVisible }}
    >
      {children}
    </NavigationVisibilityContext.Provider>
  );
}

export function useNavigationVisibility() {
  const context = useContext(NavigationVisibilityContext);

  if (context == null) {
    throw new Error(
      "useNavigationVisibility must be used within NavigationVisibilityProvider.",
    );
  }

  return context;
}
