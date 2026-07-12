import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key || !url.startsWith("http")) {
    if (typeof window !== "undefined") {
      console.warn("[supabase] Missing or invalid NEXT_PUBLIC_SUPABASE_URL/ANON_KEY in client bundle. URL:", url);
    }
    return createSupabaseClient(
      url || "https://placeholder.supabase.co",
      key || "placeholder-key"
    );
  }
  if (typeof window === "undefined") {
    return createSupabaseClient(url, key);
  }
  if (!_client) {
    _client = createBrowserClient(url, key);
  }
  return _client;
}
