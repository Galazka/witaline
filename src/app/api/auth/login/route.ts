import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email i hasło są wymagane." }, { status: 400 });
    }

    const cookiesToSet: { name: string; value: string; options?: any }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              req.cookies.set(name, value);
              cookiesToSet.push({ name, value, options });
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
    const response = NextResponse.json({ ok: true, userId: user?.id, email: user?.email });

    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Wystąpił błąd serwera." }, { status: 500 });
  }
}
