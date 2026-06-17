import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

  let query = supabaseAdmin
    .from("notifications")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (user.email === ADMIN_EMAIL) {
    // Admin sees all
  } else {
    // Regular user sees only their business's notifications
    const { data: businesses } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("owner_uid", user.id);

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ notifications: [], unread_count: 0, total: 0 });
    }

    const businessIds = businesses.map((b: { id: string }) => b.id);
    query = query.in("business_id", businessIds);
  }

  const { data: notifications, count } = await query.limit(limit);

  const unreadCount = notifications
    ? notifications.filter((n: { is_read: boolean }) => !n.is_read).length
    : 0;

  return NextResponse.json({
    notifications: notifications || [],
    unread_count: unreadCount,
    total: count || 0,
  });
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const isAdmin = user.email === ADMIN_EMAIL;

  if (body.mark_all_read) {
    if (isAdmin) {
      await supabaseAdmin.from("notifications").update({ is_read: true }).is("is_read", false);
    } else {
      const { data: businesses } = await supabaseAdmin
        .from("businesses")
        .select("id")
        .eq("owner_uid", user.id);
      if (businesses && businesses.length > 0) {
        const ids = businesses.map((b: { id: string }) => b.id);
        await supabaseAdmin.from("notifications").update({ is_read: true }).in("business_id", ids).is("is_read", false);
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    const updates: Record<string, unknown> = {};
    if (body.is_read !== undefined) updates.is_read = body.is_read;
    if (body.metadata !== undefined) updates.metadata = body.metadata;

    await supabaseAdmin.from("notifications").update(updates).eq("id", body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Missing id or mark_all_read" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (body.id) {
    await supabaseAdmin.from("notifications").delete().eq("id", body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Missing id" }, { status: 400 });
}
