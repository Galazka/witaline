import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { data, error: dbError } = await supabaseAdmin
    .from("support_agents")
    .select(`
      *,
      user:user_id(email)
    `)
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const body = await req.json();
  const { email, password, user_id, role } = body;

  let targetUserId = user_id;

  if (email && password) {
    // Check if user already exists in auth.users
    const { data: existingUser } = await supabaseAdmin
      .from("auth.users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser?.id) {
      targetUserId = existingUser.id;
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 500 });
      }
      targetUserId = created.user?.id;
    }
  }

  if (!targetUserId) {
    return NextResponse.json({ error: "user_id or email+password is required" }, { status: 400 });
  }

  const { data, error: dbError } = await supabaseAdmin
    .from("support_agents")
    .insert({
      user_id: targetUserId,
      role: role || "support",
      is_active: true,
    })
    .select()
    .single();

  if (dbError) {
    if (dbError.message.includes("duplicate")) {
      return NextResponse.json({ error: "User is already a support agent" }, { status: 400 });
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const body = await req.json();
  const { id, role, is_active } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error: dbError } = await supabaseAdmin
    .from("support_agents")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}