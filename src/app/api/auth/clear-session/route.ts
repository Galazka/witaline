import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const sbCookies = allCookies.filter((c) => c.name.startsWith("sb-"));

  const response = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));

  for (const c of sbCookies) {
    response.cookies.set(c.name, "", { maxAge: 0, path: "/" });
  }

  response.cookies.set("supabase-auth-token", "", { maxAge: 0, path: "/" });

  return response;
}
