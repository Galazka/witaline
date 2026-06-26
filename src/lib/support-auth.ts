import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase-admin";

export interface SupportAgent {
  id: string;
  user_id: string;
  role: "support" | "admin";
  is_active: boolean;
}

export async function checkSupportAuth() {
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
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), agent: null, user: null };
  }

  const { data: agent } = await supabaseAdmin
    .from("support_agents")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!agent) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), agent: null, user: null };
  }

  return { error: null, agent: agent as SupportAgent, user };
}
