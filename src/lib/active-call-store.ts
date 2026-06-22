import { supabaseAdmin } from "./supabase-admin";
import { withCache } from "./cache";

export async function setActiveCallSid(businessId: string, callSid: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("active_calls")
    .upsert(
      {
        business_id: businessId,
        call_sid: callSid,
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "call_sid" }
    );

  if (error) {
    console.error("[active-call-store] set error:", error.message);
  }
}

export async function getActiveCallSids(businessId: string): Promise<string[]> {
  const cacheKey = `active_calls:${businessId}`;

  return withCache(cacheKey, async () => {
    const { data, error } = await supabaseAdmin
      .from("active_calls")
      .select("call_sid")
      .eq("business_id", businessId)
      .gte("expires_at", new Date().toISOString());

    if (error) {
      console.error("[active-call-store] get error:", error.message);
      return [];
    }

    return (data || []).map((r: { call_sid: string }) => r.call_sid);
  }, 5_000);
}

export async function removeActiveCallSid(callSid: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("active_calls")
    .delete()
    .eq("call_sid", callSid);

  if (error) {
    console.error("[active-call-store] remove error:", error.message);
  }
}
