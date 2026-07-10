import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const allCookies = req.cookies.getAll();
  const authCookie = allCookies.find(c => c.name.includes("auth-token"));
  return NextResponse.json({
    hasAuthCookie: !!authCookie,
    cookieName: authCookie?.name || null,
    cookieLength: authCookie?.value?.length || 0,
    allCookieNames: allCookies.map(c => c.name),
    cookieHeader: req.headers.get("cookie"),
  });
}
