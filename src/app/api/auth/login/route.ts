import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email i hasło są wymagane." }, { status: 400 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach(({ name, value }) => {
              req.cookies.set(name, value);
            });
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

    const { user } = result.data;
    const response = NextResponse.json({ ok: true });
    req.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Wystąpił błąd serwera." }, { status: 500 });
  }
}
