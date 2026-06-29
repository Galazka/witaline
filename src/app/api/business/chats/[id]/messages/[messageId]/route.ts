import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; messageId: string }> }
) {
  const params = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
    .eq("id", params.messageId)
    .eq("conversation_id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
