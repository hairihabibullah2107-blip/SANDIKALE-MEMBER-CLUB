import { createClient } from "@supabase/supabase-js";

// Browser-safe configuration for the dedicated SANDIKALE Member Club project.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://bpfurmqbtredhipendpz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_48Rc2wmf29Jfss6O0XMZnw_FLZMOGpC";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
