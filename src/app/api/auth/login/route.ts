import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email i hasło są wymagane." }, { status: 400 });
    }

    let collectedCookies: { name: string; value: string }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookies) {
            collectedCookies = cookies.map((c) => ({ name: c.name, value: c.value }));
          },
        },
      },
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

    const response = NextResponse.json({
      ok: true,
      access_token: result.data.session.access_token,
      refresh_token: result.data.session.refresh_token,
    });
    collectedCookies.forEach((c) => {
      response.cookies.set(c.name, c.value, { path: "/", httpOnly: false, sameSite: "lax", secure: true });
    });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Wystąpił błąd serwera." }, { status: 500 });
  }
}
