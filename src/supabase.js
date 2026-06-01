import { createClient } from "@supabase/supabase-js";

// Public Supabase config. The anon key is meant to be exposed in the browser;
// real protection comes from Row Level Security policies on the database.
const url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

// When the keys aren't set yet, the app falls back to its old local-only
// behavior so nothing breaks before Supabase is wired up.
export const supabaseEnabled = Boolean(url && anonKey);

export const supabase = supabaseEnabled
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // We use HashRouter, so don't let Supabase try to parse the URL hash.
        detectSessionInUrl: false,
      },
    })
  : null;
