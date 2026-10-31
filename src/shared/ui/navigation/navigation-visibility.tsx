"use client";

import {
  createContext,
  useEffect,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { getKeyboardInset } from "./navigation-keyboard";

type NavigationVisibilityContextValue = {
  isNavigationVisible: boolean;
  keyboardInset: number;
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
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;

    if (viewport == null) {
      return;
    }

    const updateKeyboardInset = () => {
      const activeElement = document.activeElement;
      const acceptsText =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement instanceof HTMLElement &&
          activeElement.isContentEditable);

      setKeyboardInset(
        acceptsText
          ? getKeyboardInset(
              window.innerHeight,
              viewport.height,
              viewport.offsetTop,
            )
          : 0,
      );
    };

    updateKeyboardInset();
    viewport.addEventListener("resize", updateKeyboardInset);
    viewport.addEventListener("scroll", updateKeyboardInset);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardInset);
      viewport.removeEventListener("scroll", updateKeyboardInset);
    };
  }, []);

  return (
    <NavigationVisibilityContext.Provider
      value={{ isNavigationVisible, keyboardInset, setIsNavigationVisible }}
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
