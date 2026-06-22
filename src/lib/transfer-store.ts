import { supabaseAdmin } from "./supabase-admin";

export interface PendingTransfer {
  businessId: string;
  targetNumber: string;
  callerId: string;
  businessName: string;
  fromNumber: string;
  toNumber: string;
  createdAt: number;
}

export async function setPendingTransfer(callSid: string, data: PendingTransfer): Promise<void> {
  // Upsert into a dedicated table for persistence across restarts
  const { error } = await supabaseAdmin
    .from("pending_transfers")
    .upsert(
      {
        call_sid: callSid,
        business_id: data.businessId,
        target_number: data.targetNumber,
        caller_id: data.callerId,
        business_name: data.businessName,
        from_number: data.fromNumber,
        to_number: data.toNumber,
        created_at: new Date(data.createdAt).toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      { onConflict: "call_sid" }
    );

  if (error) {
    console.error("[transfer-store] set error:", error.message);
  }
}

export async function getPendingTransfer(callSid: string): Promise<PendingTransfer | undefined> {
  const { data, error } = await supabaseAdmin
    .from("pending_transfers")
    .select("*")
    .eq("call_sid", callSid)
    .gte("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return undefined;

  return {
    businessId: data.business_id,
    targetNumber: data.target_number,
    callerId: data.caller_id,
    businessName: data.business_name,
    fromNumber: data.from_number,
    toNumber: data.to_number,
    createdAt: new Date(data.created_at).getTime(),
  };
}

export async function deletePendingTransfer(callSid: string): Promise<void> {
  await supabaseAdmin
    .from("pending_transfers")
    .delete()
    .eq("call_sid", callSid);
}

export async function findPendingTransferByBusinessId(businessId: string): Promise<{ callSid: string; data: PendingTransfer } | undefined> {
  const { data, error } = await supabaseAdmin
    .from("pending_transfers")
    .select("*")
    .eq("business_id", businessId)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return undefined;

  return {
    callSid: data.call_sid,
    data: {
      businessId: data.business_id,
      targetNumber: data.target_number,
      callerId: data.caller_id,
      businessName: data.business_name,
      fromNumber: data.from_number,
      toNumber: data.to_number,
      createdAt: new Date(data.created_at).getTime(),
    },
  };
}
