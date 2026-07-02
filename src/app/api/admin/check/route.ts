import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET() {
  const result = await checkAdminAuth();
  return NextResponse.json({ isAdmin: !result.error });
}
