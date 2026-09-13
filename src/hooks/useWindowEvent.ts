import { useEffect, useRef } from "react";
import type { CluideEvent } from "@/lib/events";

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
