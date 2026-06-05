import { useCallback, useEffect, useState } from "react";

// Lightweight "wishlist" persisted in localStorage. Shared across mobile
// screens via a window event so the heart state stays in sync everywhere.
const KEY = "phrazs_saved_v1";
const EVT = "phrazs:saved-change";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function write(set) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    /* storage unavailable — keep working in-memory for this session */
  }
  window.dispatchEvent(new Event(EVT));
}

export function useSaved() {
  const [ids, setIds] = useState(read);

  useEffect(() => {
    const sync = () => setIds(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id) => {
    const next = read();
    next.has(id) ? next.delete(id) : next.add(id);
    write(next);
    setIds(next);
  }, []);

  const isSaved = useCallback((id) => ids.has(id), [ids]);

  return { savedIds: ids, isSaved, toggle, count: ids.size };
}
