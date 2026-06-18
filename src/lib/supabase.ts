import { createBrowserClient } from "@supabase/ssr";

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
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return stub;
  }
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}




