import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const refreshAdmin = useCallback(async () => {
    try {
      const session = await apiRequest("/api/admin/session", { method: "GET" });
      setIsAdmin(!!session.isAdmin);
      setAdminEmail(session.email || "");
      return !!session.isAdmin;
    } catch (err) {
      setIsAdmin(false);
      setAdminEmail("");
      if (String(err?.message || "").includes("Failed to fetch")) {
        setAdminEmail("");
      }
      return false;
    } finally {
      setCheckingAdmin(false);
    }
  }, []);

  useEffect(() => {
    refreshAdmin();
  }, [refreshAdmin]);

  const signIn = useCallback(async (email, passcode) => {
    const session = await apiRequest("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, passcode }),
    });
    setIsAdmin(!!session.isAdmin);
    setAdminEmail(session.email || "");
    return !!session.isAdmin;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiRequest("/api/admin/logout", { method: "POST" });
    } catch {
      /* still clear local admin state if the network request fails */
    } finally {
      setIsAdmin(false);
      setAdminEmail("");
    }
  }, []);

  const value = useMemo(
    () => ({ isAdmin, adminEmail, checkingAdmin, refreshAdmin, signIn, signOut }),
    [isAdmin, adminEmail, checkingAdmin, refreshAdmin, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
