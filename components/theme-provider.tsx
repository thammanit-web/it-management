"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

/** 
 * ThemeMode: User setting
 * resolvedTheme: Actual applied theme (light/dark)
 */
export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 1. Theme State (Initialize from localStorage or default to light)
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || "light";
  });

  // 2. Resolve actual applied theme (system always resolves to light)
  const resolvedTheme = useMemo(() => {
    if (theme === "system") return "light";
    return theme as "light" | "dark";
  }, [theme]);

  // 4. Persistence and Effect application
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  }, [resolvedTheme, setTheme]);

  // Sync with DOM
  useEffect(() => {
    const root = document.documentElement;
    // Minimize DOM mutations by checking current classes first
    const isCurrentlyDark = root.classList.contains("dark");
    const isCurrentlyLight = root.classList.contains("light");

    if (resolvedTheme === "dark" && !isCurrentlyDark) {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else if (resolvedTheme === "light" && !isCurrentlyLight) {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [resolvedTheme]);

  // Sync state with localStorage on mount (in case it changed in other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setThemeState((e.newValue as ThemeMode) || "light");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme
  }), [theme, resolvedTheme, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
