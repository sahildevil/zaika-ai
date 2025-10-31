import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Singleton client for browser-side usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Factory to create a client with custom headers (e.g., Authorization bearer)
export function createSupabaseWithHeaders(headers) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: headers || {} },
  });
}


