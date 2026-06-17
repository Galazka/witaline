import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { tool, params } = await req.json();
  // Minimal JSON-RPC handler
  switch (tool) {
    case "get_time":
      return NextResponse.json({ result: new Date().toISOString() });
    default:
      return NextResponse.json({ error: "unknown tool" }, { status: 400 });
  }
}
