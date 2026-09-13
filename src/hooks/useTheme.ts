import { useSyncExternalStore } from "react";
import { currentTheme, subscribe, type Theme } from "@/lib/theme";

export const useTheme = (): Theme => useSyncExternalStore(subscribe, currentTheme);
