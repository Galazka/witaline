import { supabaseAdmin } from "./supabase-admin";

const TYPES = ["call", "lead", "booking", "feedback", "system", "sms"] as const;
type NotifType = typeof TYPES[number];

type NotifInput = {
  businessId: string;
  type: NotifType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export async function addNotification(input: NotifInput) {
  const { error } = await supabaseAdmin.from("notifications").insert({
    business_id: input.businessId,
    type: input.type,
    title: input.title,
    message: input.message,
    metadata: input.metadata || {},
    is_read: false,
    created_at: new Date().toISOString(),
  });

  if (error) console.error("[addNotification]", error);
}
