import { createClient } from "@supabase/supabase-js";

// Browser-safe configuration: Netlify build variables with safe local fallback.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://zwtjqtwidfezvfhxmkyf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_6k86xVDOm5EUkHCTtABXTQ_-_Y_mz0f";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
