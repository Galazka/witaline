import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { checkPermission, isBusinessOwnerOrSuperAdmin } from "@/lib/permissions";
import type { Permission } from "@/types/database";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const businessId = url.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const isOwner = await isBusinessOwnerOrSuperAdmin(user.id, user.email || "", businessId);
  const { data: staff } = await supabase
    .from("business_staff")
    .select("role, permissions")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: biz } = await supabase
    .from("businesses")
    .select("verification_status")
    .eq("id", businessId)
    .single();

  return NextResponse.json({
    isOwner,
    isSuperAdmin: isOwner && !!user.email && process.env.SUPER_ADMIN_EMAILS?.includes(user.email),
    role: staff?.role || (isOwner ? "admin" : null),
    permissions: staff?.permissions || [],
    verificationStatus: biz?.verification_status || "pending",
  });
}
