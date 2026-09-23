"use client";

import { useState, useEffect, useCallback } from "react";

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useNeuralFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const runFetch = async (attempt = 1): Promise<void> => {
      try {
        const res = await fetcher();
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      } catch (err: any) {
        const isOfflineOr503 =
          err?.status === 503 ||
          err?.message?.includes("503") ||
          err?.message?.includes("offline") ||
          err?.message?.includes("unreachable");

        if (isOfflineOr503 && attempt <= 2 && !cancelled) {
          setTimeout(() => {
            if (!cancelled) runFetch(attempt + 1);
          }, attempt * 1000);
          return;
        }

        if (!cancelled) {
          setError(err?.message || "Failed to fetch");
          setLoading(false);
        }
      }
    };

    runFetch();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, ...deps]);

  return { data, loading, error, refetch };
}

export { useNeuralEvents } from "./hooks/use-events";
export { useNeuralAgent } from "./hooks/use-neural-agent";
