import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js"; // <- .js no import

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});
