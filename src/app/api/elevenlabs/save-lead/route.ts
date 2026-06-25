import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendNewLeadEmail } from "@/lib/email";
import { addNotification } from "@/lib/notifications";
import { sendSlackNotification, leadSlackBlocks } from "@/lib/slack-notify";

const saveLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().max(255).optional().default(""),
  interest: z.string().max(255).optional().default(""),
  notes: z.string().max(5000).optional().default(""),
  business_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const raw = body.parameters
      ? (body.parameters as Record<string, unknown>)
      : body;
    const parsed = saveLeadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues.map(i => `${i.path}: ${i.message}`).join("; ") }, { status: 400 });
    }

    const { name, phone, email, interest, notes, business_id: businessId } = parsed.data;

    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert({
        company_name: name,
        phone,
        nip: "",
        industry: interest || "ogólne",
        knowledge_base_raw: notes,
        status: "new",
        type: "kontakt",
        message: notes,
        contact_email: email || "",
        business_id: businessId || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[save-lead] DB error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await supabaseAdmin.from("contact_messages").insert({
      business_id: businessId || null,
      name,
      phone,
      email: email || null,
      message: `Nowy lead: ${interest}${notes ? " - " + notes : ""}`,
      status: "new",
      created_at: new Date().toISOString(),
    });

    // Send new lead email to business owner (non-blocking)
    if (businessId) {
      (async () => {
        try {
          const { data: biz } = await supabaseAdmin
            .from("businesses")
            .select("owner_uid, name")
            .eq("id", businessId)
            .single();
          if (!biz?.owner_uid || !biz?.name) return;
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(biz.owner_uid);
          const userEmail = userData?.user?.email;
          if (userEmail) {
            await sendNewLeadEmail(userEmail, biz.name, name, phone, interest);
          }
          await addNotification({
            businessId,
            type: "lead",
            title: "Nowy lead",
            message: `Nowy lead od ${name}${phone ? ` (${phone})` : ""}${interest ? ` - ${interest}` : ""}`,
            metadata: { name, phone, email, interest, notes },
          });
          await sendSlackNotification(businessId, leadSlackBlocks({ name, phone, email, interest, notes }));
        } catch (err) {
          console.error("[save-lead] email/slack notification failed:", err);
        }
      })();
    }

    return NextResponse.json({ ok: true, lead: data });
  } catch (err) {
    console.error("[save-lead]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
