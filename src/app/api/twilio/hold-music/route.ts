import { NextResponse } from "next/server";

export async function GET() {
  const mp3Url = process.env.HOLD_MUSIC_URL || "https://cdn.witaline.app/hold-music.mp3";
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${mp3Url}</Play></Response>`;
  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}

export async function POST() {
  return GET();
}
