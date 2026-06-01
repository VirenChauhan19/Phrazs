import { createContext, useContext, useEffect, useCallback, useMemo, useState } from "react";
import { supabase, supabaseEnabled } from "./supabase.js";

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(supabaseEnabled);

  const loadProfile = useCallback(async (uid) => {
    if (!uid) return setProfile(null);
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile(data || null);
  }, []);

  // Restore any existing session and keep state in sync with auth changes.
  useEffect(() => {
    if (!supabaseEnabled) return;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const sessionUser = data.session?.user || null;
      setUser(sessionUser);
      loadProfile(sessionUser?.id).finally(() => active && setLoading(false));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      loadProfile(sessionUser?.id);
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(async ({ name, email, phone, password }) => {
    if (!supabaseEnabled) throw new Error("Accounts aren't available yet — Supabase is not configured.");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone } },
    });
    if (error) throw new Error(error.message);
    // If email confirmation is on, there's no session yet.
    if (!data.session) {
      return { needsConfirmation: true };
    }
    await loadProfile(data.user?.id);
    return { needsConfirmation: false };
  }, [loadProfile]);

  const signIn = useCallback(async (email, password) => {
    if (!supabaseEnabled) throw new Error("Accounts aren't available yet — Supabase is not configured.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    await loadProfile(data.user?.id);
    return true;
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    if (!supabaseEnabled) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (patch) => {
    if (!supabaseEnabled || !user) throw new Error("You need to be signed in.");
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    setProfile(data || null);
    return data;
  }, [user]);

  // Persist a completed booking to the signed-in user's account.
  const saveBooking = useCallback(async (record) => {
    if (!supabaseEnabled || !user) return null;
    const row = {
      user_id: user.id,
      listing_id: String(record.propertyId ?? record.listingId ?? ""),
      property: record.property || "",
      host: record.host || "",
      start_ts: record.start || "",
      end_ts: record.end || "",
      date: record.date || "",
      end_date: record.endDate || "",
      days: Number(record.days) || 1,
      hours: Number(record.hours) || 0,
      crew: Number(record.crew) || 1,
      total: Number(record.total) || 0,
      status: record.status || "Confirmed",
      payment_status: record.paymentStatus || "Paid",
      schedule: Array.isArray(record.schedule) ? record.schedule : [],
      notes: record.notes || "",
    };
    const { data, error } = await supabase.from("bookings").insert(row).select().maybeSingle();
    if (error) {
      // Don't block the confirmation UI if the insert fails; log for debugging.
      console.error("Failed to save booking to Supabase:", error.message);
      return null;
    }
    return data;
  }, [user]);

  const listBookings = useCallback(async () => {
    if (!supabaseEnabled || !user) return [];
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load bookings from Supabase:", error.message);
      return [];
    }
    return data || [];
  }, [user]);

  const value = useMemo(
    () => ({
      enabled: supabaseEnabled,
      user,
      profile,
      loading,
      isLoggedIn: !!user,
      displayName: profile?.full_name || user?.user_metadata?.full_name || user?.email || "",
      signUp,
      signIn,
      signOut,
      updateProfile,
      saveBooking,
      listBookings,
    }),
    [user, profile, loading, signUp, signIn, signOut, updateProfile, saveBooking, listBookings]
  );

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error("useUserAuth must be used within UserAuthProvider");
  return ctx;
}
