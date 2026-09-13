import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { Scope } from "@shared/api";
import { emit } from "@/lib/events";
import { isMod } from "@/lib/keys";
import { screenUrl, visibleScreens } from "@/lib/routes";
import { toggleTheme } from "@/lib/theme";

// ⌘K, ⌘S, ⌘1-9, ⌘⇧T and Esc. Radix layers take Esc first (document, capture) and
// preventDefault when they dismiss, so an Esc that reaches here with nothing open discards edits.
export function useShortcuts(scope: Scope, toggleMenu: () => void): void {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (isMod(e) && key === "k") {
        e.preventDefault();
        toggleMenu();
      } else if (isMod(e) && e.shiftKey && key === "t") {
        e.preventDefault();
        toggleTheme();
      } else if (isMod(e) && key === "s") {
        e.preventDefault();
        emit("cluide:save");
      } else if (isMod(e) && !e.shiftKey && key >= "1" && key <= "9") {
        const item = visibleScreens(scope)[Number(key) - 1];
        if (item) {
          e.preventDefault();
          navigate(screenUrl(scope, item.id));
        }
      } else if (e.key === "Escape" && !e.defaultPrevented) {
        emit("cluide:escape");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scope, toggleMenu, navigate]);
}
