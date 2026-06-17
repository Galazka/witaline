import { supabaseAdmin } from "./supabase-admin";

export async function authenticateApiKey(request: Request): Promise<{ businessId: string; error: null } | { businessId: null; error: Response }> {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return { businessId: null, error: new Response(JSON.stringify({ error: "Missing or invalid Authorization header. Use: Bearer <api_key>" }), { status: 401, headers: { "Content-Type": "application/json" } }) };
  }

  const apiKey = auth.slice(7).trim();
  if (!apiKey) {
    return { businessId: null, error: new Response(JSON.stringify({ error: "API key is required" }), { status: 401, headers: { "Content-Type": "application/json" } }) };
  }

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("api_key", apiKey)
    .maybeSingle();

  if (!biz) {
    return { businessId: null, error: new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401, headers: { "Content-Type": "application/json" } }) };
  }

  return { businessId: biz.id, error: null };
}
