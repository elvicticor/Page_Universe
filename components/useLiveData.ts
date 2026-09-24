"use client";

import { useEffect, useState } from "react";

/** Una consulta a la vez; conserva el último dato señalando el fallo y se suspende al ocultar la pestaña. */
export function useLiveData<T>(url: string, interval: number) {
  const [state, setState] = useState<{ data: T | null; error: boolean; updatedAt: number | null }>({ data: null, error: false, updatedAt: null });
  useEffect(() => {
    let disposed = false, failures = 0, running = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | null = null;
    const poll = async () => {
      if (disposed || document.hidden || running) return;
      running = true;
      const request = new AbortController();
      controller = request;
      const timeout = setTimeout(() => request.abort(), 18000);
      try {
        const response = await fetch(url, { signal: request.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Consulta no disponible");
        const data: T = await response.json();
        if (!disposed) setState({ data, error: false, updatedAt: Date.now() });
        failures = 0;
      } catch {
        if (!disposed && !document.hidden) {
          failures++;
          setState((previous) => ({ ...previous, error: true }));
        }
      } finally {
        clearTimeout(timeout);
        running = false;
        if (!disposed && !document.hidden) timer = setTimeout(poll, Math.min(interval * 2 ** failures, 120000));
      }
    };
    const visibility = () => {
      clearTimeout(timer);
      if (document.hidden) controller?.abort();
      else void poll();
    };
    void poll();
    document.addEventListener("visibilitychange", visibility);
    return () => { disposed = true; clearTimeout(timer); controller?.abort(); document.removeEventListener("visibilitychange", visibility); };
  }, [url, interval]);
  return state;
}
