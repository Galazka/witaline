import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function readEnvVar(name: string): string | undefined {
  if (typeof window === "undefined") return process.env[name]?.trim();
  try {
    const fromProcess = process.env[name]?.trim();
    if (fromProcess) return fromProcess;
  } catch {}
  try {
    const el = document.getElementById("witaline-env");
    if (el) {
      const config = JSON.parse(el.textContent || "{}");
      const key = name === "NEXT_PUBLIC_SUPABASE_URL" ? "url" : "key";
      return config[key]?.trim() || undefined;
    }
  } catch {}
  return undefined;
}

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = readEnvVar("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !key || !url.startsWith("http")) {
    if (typeof window !== "undefined") {
      console.warn("[supabase] Missing or invalid Supabase URL/Key in client bundle. URL:", url);
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
