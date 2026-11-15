import { useEffect, useRef } from "react";

// Runs fn on mount, whenever deps change, every intervalMs,
// and when the tab becomes visible again. Pauses while the tab is hidden.
export default function usePolling(fn, deps = [], intervalMs = 15000) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    fnRef.current();

    const timer = setInterval(() => {
      if (!document.hidden) fnRef.current();
    }, intervalMs);

    const onVisible = () => {
      if (!document.hidden) fnRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, intervalMs]);
}