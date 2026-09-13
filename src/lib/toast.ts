export interface Toast {
  id: number;
  title: string;
  description?: string;
  error?: boolean;
  action?: { label: string; run: () => void };
}

let current: Toast | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let seq = 0;
const listeners = new Set<() => void>();
const notify = () => {
  for (const l of listeners) l();
};

export function toast(t: Omit<Toast, "id">): void {
  clearTimeout(timer);
  current = { ...t, id: ++seq };
  notify();
  timer = setTimeout(dismiss, 6000);
}

export function dismiss(): void {
  clearTimeout(timer);
  current = null;
  notify();
}

export const currentToast = (): Toast | null => current;

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
