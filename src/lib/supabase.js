import { createClient } from "@supabase/supabase-js";

// Read environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/**
 * Check if valid Supabase URL and Anon Key are provided
 */
export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("YOUR_SUPABASE_URL") &&
    supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY"
  );
}

// Fallback dummy client for offline / mock mode when keys are absent
const mockClient = {
  from: () => ({
    select: () => ({ data: null, error: new Error("Supabase is not configured") }),
    insert: () => ({ data: null, error: new Error("Supabase is not configured") }),
    update: () => ({ data: null, error: new Error("Supabase is not configured") }),
    upsert: () => ({ data: null, error: new Error("Supabase is not configured") }),
    delete: () => ({ data: null, error: new Error("Supabase is not configured") }),
    eq: function () { return this; },
    single: function () { return this; }
  }),
  channel: () => ({
    on: function () { return this; },
    subscribe: function () { return { unsubscribe: () => {} }; }
  }),
  removeChannel: () => {}
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false // Using custom app session persistence
      }
    })
  : mockClient;

export default supabase;
