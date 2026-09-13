import { useEffect, useRef } from "react";

export type CluideEvent =
  | "cluide:save" | "cluide:escape" | "cluide:primary"
  | "cluide:offline" | "cluide:online" | "cluide:retry";

export const emit = (name: CluideEvent): void => {
  window.dispatchEvent(new Event(name));
};

export function useWindowEvent(name: CluideEvent, handler: () => void): void {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    const run = () => ref.current();
    window.addEventListener(name, run);
    return () => window.removeEventListener(name, run);
  }, [name]);
}
