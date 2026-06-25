import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWelcomeEmail, sendTrialActivationEmail } from "@/lib/email";

async function assignExtension(supabaseA: typeof supabaseAdmin, businessId: string): Promise<string | null> {
  const { data: existing } = await supabaseA
    .from("businesses")
    .select("extension")
    .order("created_at", { ascending: true });

  const taken = new Set((existing || []).map((r: any) => r.extension).filter(Boolean));

  let ext: string | null = null;
  for (let i = 10; i < 999; i++) {
    const s = String(i);
    if (!taken.has(s)) {
      ext = s;
      break;
    }
  }

  if (ext) {
    await supabaseA.from("businesses").update({ extension: ext }).eq("id", businessId);
  }
  return ext;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, plan, systemPrompt, menuCatalog, websiteUrl, phone, industry, templateId, services, calendarSettings } = body;

  if (!name || !plan) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validPlans = ["start_100", "pro_500", "enterprise_2000", "elastic_0", "pro_249", "lux_599"];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("owner_uid", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Business already exists for this user" }, { status: 409 });
  }

  const { data: business, error } = await supabaseAdmin
    .from("businesses")
    .insert({
      owner_uid: user.id,
      name,
      current_plan: plan,
      system_prompt: systemPrompt || "",
      menu_catalog: menuCatalog || {},
      industry: body.industry || "",
      website_url: websiteUrl || "",
      phone: phone || "",
    })
    .select()
    .single();

  if (error || !business) {
    return NextResponse.json({ error: error?.message || "Nie udało się utworzyć firmy" }, { status: 500 });
  }

  const extension = await assignExtension(supabaseAdmin, business.id);

  // Send welcome + trial activation emails (non-blocking)
  if (user.email) {
    fireWelcomeEmail(user.email, name, plan);
    const testNumber = process.env.WITALINE_TEST_NUMBER || process.env.TWILIO_PHONE_NUMBER || "+48 732 125 752";
    sendTrialActivationEmail(user.email, name, testNumber).catch(e =>
      console.error("[onboarding] trial activation email error:", e)
    );
  }

  // Insert template services if provided
  if (services?.length) {
    const { error: svcErr } = await supabaseAdmin
      .from("services")
      .insert(
        services.map((s: { name: string; duration_minutes: number }) => ({
          business_id: business.id,
          name: s.name,
          duration_minutes: s.duration_minutes,
        }))
      );
    if (svcErr) console.error("Failed to insert template services:", svcErr);
  }

  // Insert template calendar settings if provided
  if (calendarSettings) {
    const { error: calErr } = await supabaseAdmin
      .from("calendar_settings")
    .upsert({
      business_id: business.id,
      ...(calendarSettings || {}),
    });
    if (calErr) console.error("Failed to insert calendar settings:", calErr);
  }

  return NextResponse.json({ business, extension }, { status: 201 });
}

// Send welcome email (non-blocking)
function fireWelcomeEmail(userEmail: string, businessName: string, plan: string) {
  sendWelcomeEmail(userEmail, businessName, plan).catch(err => {
    console.error("[onboarding] welcome email failed:", err);
  });
}





