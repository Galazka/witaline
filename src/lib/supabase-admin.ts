let _client: any = null;

function getClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url?.startsWith("http")) {
      const { createClient } = require("@supabase/supabase-js");
      _client = createClient(url, key);
    }
  }
  return _client;
}

export function getSupabaseAdmin() {
  return getClient();
}

export const supabaseAdmin = new Proxy({} as any, {
  get(_, prop: string) {
    const c = getClient();
    if (!c) {
      return (...args: any[]) => Promise.resolve({ data: null, error: null });
    }
    const val = c[prop];
    return typeof val === "function" ? val.bind(c) : val;
  },
});
