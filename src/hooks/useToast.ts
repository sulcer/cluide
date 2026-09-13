import { useSyncExternalStore } from "react";
import { currentToast, subscribe, type Toast } from "@/lib/toast";

export const useToast = (): Toast | null => useSyncExternalStore(subscribe, currentToast);
