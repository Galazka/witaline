import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createBrowserClient> | null = null;

function makeStub(): any {
  return new Proxy(() => Promise.resolve({ data: null, error: null }), {
    get(t, p) {
      if (p === "then" || p === Symbol.toPrimitive) return undefined;
      return makeStub();
    },
    apply(_t, _this, args) {
      return Promise.resolve({ data: { subscription: null, session: null }, error: null });
    },
  });
}

const stub = makeStub();

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key || !url.startsWith("http")) {
    return stub;
  }
  if (typeof window === "undefined") {
    return createSupabaseClient(url, key);
  }
  if (!_client) {
    _client = createBrowserClient(url, key);
  }
  return _client;
}
