import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

async function adminRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Admin request failed.");
  return data;
}

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const refreshAdmin = useCallback(async () => {
    try {
      const session = await adminRequest("/api/admin/session", { method: "GET" });
      setIsAdmin(!!session.isAdmin);
      setAdminEmail(session.email || "");
      return !!session.isAdmin;
    } catch {
      setIsAdmin(false);
      setAdminEmail("");
      return false;
    } finally {
      setCheckingAdmin(false);
    }
  }, []);

  useEffect(() => {
    refreshAdmin();
  }, [refreshAdmin]);

  const signIn = useCallback(async (email, passcode) => {
    const session = await adminRequest("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, passcode }),
    });
    setIsAdmin(!!session.isAdmin);
    setAdminEmail(session.email || "");
    return !!session.isAdmin;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await adminRequest("/api/admin/logout", { method: "POST" });
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
