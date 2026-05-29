import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ADMIN_EMAIL, ADMIN_PASSCODE } from "./data.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "phrazsAdminUnlocked";

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const signIn = useCallback((email, password) => {
    const ok = String(email).trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSCODE;
    if (ok) {
      try {
        sessionStorage.setItem(STORAGE_KEY, "true");
      } catch {
        /* sessionStorage unavailable — keep in-memory */
      }
      setIsAdmin(true);
    }
    return ok;
  }, []);

  const signOut = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setIsAdmin(false);
  }, []);

  const value = useMemo(() => ({ isAdmin, signIn, signOut }), [isAdmin, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
