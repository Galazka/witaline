const SG_API_BASE = "https://api.sendgrid.com/v3";

function getApiKey(): string {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error("SENDGRID_API_KEY not set");
  return key;
}

function getFrom(): { email: string; name: string } {
  const raw = process.env.EMAIL_FROM || "WitaLine <noreply@witaline.pl>";
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: "WitaLine", email: raw };
}

export interface SendGridEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: { filename: string; content: string; type: string }[];
  categories?: string[];
}

export interface SendGridResult {
  ok: boolean;
  id?: string;
  error?: string;
}

async function sgRequest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${SG_API_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${getApiKey()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status !== 204 ? await res.json().catch(() => ({})) : {};
  if (!res.ok) throw new Error(data.message || data.errors?.[0]?.message || `SendGrid error ${res.status}`);
  return data;
}

export async function sendEmail(msg: SendGridEmail): Promise<SendGridResult> {
  try {
    const from = getFrom();
    const content: { type: string; value: string }[] = [{ type: "text/html", value: msg.html }];
    if (msg.text) content.push({ type: "text/plain", value: msg.text });
    const payload: Record<string, unknown> = {
      personalizations: [{ to: [{ email: msg.to }], subject: msg.subject }],
      from,
      content,
      categories: msg.categories || ["witaline"],
    };
    if (msg.attachments?.length) {
      payload.attachments = msg.attachments.map(a => ({
        filename: a.filename,
        content: a.content,
        type: a.type,
        disposition: "attachment",
      }));
    }
    const data = await sgRequest("POST", "/mail/send", payload);
    return { ok: true, id: data?.id || `sg-${Date.now()}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sendgrid] send error:", msg);
    return { ok: false, error: msg };
  }
}

// Template management
export interface SgTemplate {
  id: string;
  name: string;
  version?: { id: string; subject: string; html_content: string; active: number };
}

export async function listTemplates(pageSize = 50): Promise<SgTemplate[]> {
  const data = await sgRequest("GET", `/templates?generations=dynamic&page_size=${pageSize}`);
  return data.templates || [];
}

export async function createTemplate(name: string): Promise<SgTemplate> {
  return sgRequest("POST", "/templates", { name, generation: "dynamic" });
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await sgRequest("DELETE", `/templates/${templateId}`);
}

export async function createTemplateVersion(templateId: string, subject: string, htmlContent: string): Promise<{ id: string }> {
  return sgRequest("POST", `/templates/${templateId}/versions`, {
    template_id: templateId,
    subject,
    html_content: htmlContent,
    active: 1,
  });
}

// Send with SendGrid dynamic template
export async function sendTemplateEmail(
  to: string,
  templateId: string,
  dynamicData: Record<string, unknown>,
  categories?: string[]
): Promise<SendGridResult> {
  try {
    const from = getFrom();
    const data = await sgRequest("POST", "/mail/send", {
      personalizations: [{ to: [{ email: to }], dynamic_template_data: dynamicData }],
      from,
      template_id: templateId,
      categories: categories || ["witaline"],
    });
    return { ok: true, id: data?.id || `sg-${Date.now()}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sendgrid] template send error:", msg);
    return { ok: false, error: msg };
  }
}

// Fetch Stripe invoice PDF as base64
export async function fetchInvoicePdf(invoiceUrl: string): Promise<{ content: string; filename: string } | null> {
  try {
    const res = await fetch(invoiceUrl);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const filename = `faktura-${new Date().toISOString().slice(0, 10)}.pdf`;
    return { content: base64, filename };
  } catch {
    return null;
  }
}
