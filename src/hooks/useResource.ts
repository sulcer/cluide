import { useCallback, useEffect, useState } from "react";
import { api, type ApiError } from "@/api/client";
import { useWindowEvent } from "@/hooks/useWindowEvent";

// One resource per screen, loaded on mount, reloaded on demand or on the offline banner's Retry.
export function useResource<T>(url: string | null) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<ApiError | undefined>(undefined);
  const [tick, setTick] = useState(0);

  // A new url clears the data; a reload keeps the old data on screen until the fresh one arrives.
  useEffect(() => {
    setData(undefined);
    setError(undefined);
  }, [url]);

  useEffect(() => {
    if (url === null) return;
    let live = true;
    api.get<T>(url).then(
      (d) => { if (live) { setData(d); setError(undefined); } },
      (e) => { if (live) setError(e as ApiError); },
    );
    return () => { live = false; };
  }, [url, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  useWindowEvent("cluide:retry", reload);

  return { data, error, loading: url !== null && data === undefined && error === undefined, reload, setData };
}
