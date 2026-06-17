import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getMemberRole, canEdit } from "@/lib/rbac";
import { logChanges, getRequestInfo } from "@/lib/audit";
import { checkNameChange } from "@/lib/verification";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, action, value } = await request.json();

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .eq("owner_uid", user.id)
    .single();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "topup") {
    const extraMinutes = parseInt(value, 10);
    if (isNaN(extraMinutes) || extraMinutes < 1) {
      return NextResponse.json({ error: "Invalid minutes" }, { status: 400 });
    }

    await supabaseAdmin
      .from("businesses")
      .update({
        minutes_used_this_week:
          Math.max(0, business.minutes_used_this_week - extraMinutes),
      })
      .eq("id", businessId);

    return NextResponse.json({ ok: true, topup: extraMinutes });
  }

  return NextResponse.json({ error: "Invalid action. Plan changes require Stripe checkout." }, { status: 400 });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, systemPrompt, menuCatalog, name } = await request.json();

  // RBAC: check permission
  const role = await getMemberRole(businessId, user.id);
  if (!canEdit(role)) {
    return NextResponse.json({ error: "Nie masz uprawnień do edycji" }, { status: 403 });
  }

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check name change restrictions
  if (name && name !== business.name) {
    const nameCheck = await checkNameChange(businessId, name);
    if (!nameCheck.allowed) {
      return NextResponse.json({ error: nameCheck.reason }, { status: 403 });
    }
  }

  const updates: Record<string, unknown> = {};
  if (systemPrompt !== undefined) updates.system_prompt = systemPrompt;
  if (menuCatalog !== undefined) updates.menu_catalog = menuCatalog;
  if (name !== undefined) updates.name = name;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Log changes before updating
  const { ip, userAgent } = getRequestInfo(request);
  await logChanges(businessId, user.id, business, updates, "update", ip, userAgent);

  await supabaseAdmin.from("businesses").update(updates).eq("id", businessId);

  return NextResponse.json({ ok: true });
}





