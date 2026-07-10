import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email i hasło są wymagane." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message === "Invalid login credentials" ? "Nieprawidłowy email lub hasło." : result.error.message },
        { status: 401 },
      );
    }

    if (!result.data?.session) {
      return NextResponse.json({ error: "Nie udało się zalogować. Spróbuj ponownie." }, { status: 401 });
    }

    const { session, user } = result.data;

    return NextResponse.json({
      ok: true,
      userId: user?.id,
      email: user?.email,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Wystąpił błąd serwera." }, { status: 500 });
  }
}
