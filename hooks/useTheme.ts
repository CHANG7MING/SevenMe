"use client";

import { useEffect, useState } from "react";
import { resolveInitialTheme } from "@/lib/uiState";

export type Theme = "light" | "dark";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function savedTheme(): Theme | null {
  try {
    const saved = window.localStorage.getItem("chang7an-theme");
    return saved === "dark" || saved === "light" ? saved : null;
  } catch {
    return null;
  }
}

export function useTheme() {
  // The server always renders the light-state controls. Keep the client's first
  // render identical, then synchronize with the theme resolved by the head script.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const documentTheme = document.documentElement.dataset.theme;
    const resolved =
      documentTheme === "dark" || documentTheme === "light"
        ? resolveInitialTheme(documentTheme)
        : savedTheme() ?? systemTheme();
    setTheme(resolved);
    document.documentElement.dataset.theme = resolved;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = (event: MediaQueryListEvent) => {
      if (!savedTheme()) {
        const next = event.matches ? "dark" : "light";
        setTheme(next);
        document.documentElement.dataset.theme = next;
      }
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("chang7an-theme", next);
    } catch {
      // Theme still applies for this session when storage is unavailable.
    }
  };

  return { theme, toggleTheme };
}
