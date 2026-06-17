import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: leads, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(leads);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status, system_prompt, type } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (type) updateData.type = type;

  if (Object.keys(updateData).length > 0) {
    await supabaseAdmin.from("leads").update(updateData).eq("id", id);
  }

  if (status === "active") {
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    const { data: existingBusiness } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("owner_uid", user.id)
      .single();

    if (lead && !existingBusiness) {
      const plan = "start_100";

      await supabaseAdmin.from("businesses").insert({
        owner_uid: user.id,
        name: lead.company_name,
        twilio_number: "",
        current_plan: plan,
        minutes_used_this_week: 0,
        system_prompt: system_prompt || generatePrompt(lead),
        menu_catalog: {},
      });

      await supabaseAdmin
        .from("leads")
        .update({ status: "active" })
        .eq("id", id);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabaseAdmin.from("leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

function generatePrompt(lead: { company_name: string; industry: string | null; knowledge_base_raw: string }): string {
  return (
    `Jesteś recepcjonistą AI firmy "${lead.company_name}" z branży "${lead.industry || "usługi"}". ` +
    `Poniżej znajduje się baza wiedzy. Odpowiadaj na pytania klientów wyłącznie na jej podstawie. ` +
    `Jeśli nie znasz odpowiedzi, grzecznie poinformuj, że przekażesz zapytanie dalej. ` +
    `Zamówienia przyjmuj w sposób uporządkowany. ` +
    `Baza wiedzy:\n${lead.knowledge_base_raw}`
  );
}





