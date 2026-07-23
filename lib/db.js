import { createClient } from "@supabase/supabase-js";

// Läuft ausschließlich auf dem Server. Der service_role-Schlüssel
// darf niemals in Code gelangen, der im Browser läuft.
let client;

export function db() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
  return client;
}
