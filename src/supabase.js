import { createClient } from "@supabase/supabase-js";

// Supabase publishable key is intended for browser use. Never place a service-role key here.
const SUPABASE_URL = "https://zwtjqtwidfezvfhxmkyf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_6k86xVDOm5EUkHCTtABXTQ_-_Y_mz0f";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
