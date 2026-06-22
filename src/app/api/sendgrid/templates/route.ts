import { NextRequest, NextResponse } from "next/server";
import { listTemplates, createTemplate, deleteTemplate } from "@/lib/sendgrid";
import { sendEmail } from "@/lib/sendgrid";
import type { SendGridEmail } from "@/lib/sendgrid";

export async function GET() {
  if (!process.env.SENDGRID_API_KEY) {
    return NextResponse.json({ error: "SENDGRID_API_KEY not configured" }, { status: 400 });
  }
  try {
    const templates = await listTemplates();
    return NextResponse.json({ templates });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.SENDGRID_API_KEY) {
    return NextResponse.json({ error: "SENDGRID_API_KEY not configured" }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "create-template") {
      const { name } = body;
      if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });
      const tpl = await createTemplate(name);
      return NextResponse.json({ template: tpl });
    }

    if (action === "delete-template") {
      const { templateId } = body;
      if (!templateId) return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
      await deleteTemplate(templateId);
      return NextResponse.json({ ok: true });
    }

    if (action === "send-test") {
      const { to, subject, html, categories } = body as SendGridEmail & { to: string };
      if (!to || !subject || !html) return NextResponse.json({ error: "Missing to, subject, or html" }, { status: 400 });
      const result = await sendEmail({ to, subject, html, categories: [...(categories || []), "test"] });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
