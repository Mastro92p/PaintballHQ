import { useState, useEffect, useCallback } from "react";

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useFetch<T>(url: string): State<T> {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return; // intentional cleanup, not a real error
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [url, tick]);

  return { data, loading, error, refetch };
}