import { useEffect, useState } from "react";

// True when the viewport is phone-sized. We render an entirely separate,
// app-like experience below this breakpoint while leaving the desktop site
// untouched above it.
const QUERY = "(max-width: 768px)";

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia(QUERY).matches : false
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia(QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    // Sync immediately in case the media state changed before this ran.
    setIsMobile(mql.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  return isMobile;
}
