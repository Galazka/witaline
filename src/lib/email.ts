import { resend } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabase-admin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "WitaLine <hello@witaline.pl>";

// ── In-memory cache for email templates ──────────────────────────
let templateCache: Map<string, { subject: string; html: string }> | null = null;

export async function loadEmailTemplates(): Promise<Map<string, { subject: string; html: string }>> {
  if (templateCache) return templateCache;

  const { data } = await supabaseAdmin
    .from("email_templates")
    .select("key, subject, html");

  const map = new Map<string, { subject: string; html: string }>();
  for (const t of data || []) {
    map.set(t.key, { subject: t.subject, html: t.html });
  }
  templateCache = map;
  return map;
}

export function invalidateTemplateCache() {
  templateCache = null;
}

// ── Template rendering ────────────────────────────────────────────
function render(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, String(v));
  }
  return out;
}

// ── Core send helper ──────────────────────────────────────────────
export async function sendEmail({
  to,
  subject,
  html,
  templateKey,
  variables = {},
  categories = [],
}: {
  to: string;
  subject?: string;
  html?: string;
  templateKey?: string;
  variables?: Record<string, string | number>;
  categories?: string[];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    // If templateKey provided, try to load from DB
    let finalSubject = subject;
    let finalHtml = html;

    if (templateKey) {
      const templates = await loadEmailTemplates();
      const tmpl = templates.get(templateKey);
      if (tmpl) {
        finalSubject = render(tmpl.subject, variables);
        finalHtml = render(tmpl.html, variables);
      }
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: finalSubject,
      html: finalHtml,
      headers: categories.length > 0 ? { "X-Categories": categories.join(",") } : undefined,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[email] send error:", msg);
    return { ok: false, error: msg };
  }
}

// ── Welcome email ─────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, businessName: string, plan: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const planLabel = (plan: string) =>
    plan === "elastic_0" ? "Elastyczny" :
    plan === "start_100" ? "Start" :
    plan === "pro_500" ? "Growth" :
    plan === "pro_249" ? "Pro" :
    plan === "lux_599" ? "Lux" :
    plan === "enterprise_2000" ? "Enterprise" : plan;

  return sendEmail({
    to,
    templateKey: "welcome",
    variables: {
      businessName,
      dashboardUrl: `${APP_URL}/dashboard`,
      planLabel: planLabel(plan),
    },
    categories: ["welcome"],
  });
}

// ── Trial activation ──────────────────────────────────────────────
export async function sendTrialActivationEmail(to: string, businessName: string, testNumber: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  return sendEmail({
    to,
    templateKey: "trial_activation",
    variables: {
      businessName,
      testNumber,
      dashboardUrl: `${APP_URL}/dashboard`,
    },
    categories: ["trial-activation"],
  });
}

// ── First call congratulations ────────────────────────────────────
export async function sendFirstCallEmail(to: string, businessName: string, durationSeconds: number): Promise<{ ok: boolean; id?: string; error?: string }> {
  return sendEmail({
    to,
    templateKey: "first_call",
    variables: {
      businessName,
      minutes: String(Math.round(durationSeconds / 60)),
      dashboardUrl: `${APP_URL}/dashboard`,
    },
    categories: ["first-call"],
  });
}

// ── Trial minute warning (80% usage) ──────────────────────────────
export async function sendTrialMinuteWarningEmail(to: string, businessName: string, minutesUsed: number, maxMinutes: number): Promise<{ ok: boolean; id?: string; error?: string }> {
  return sendEmail({
    to,
    templateKey: "trial_minute_warning",
    variables: {
      businessName,
      minutesUsed: String(minutesUsed),
      maxMinutes: String(maxMinutes),
      remaining: String(Math.max(0, maxMinutes - minutesUsed)),
      dashboardUrl: `${APP_URL}/dashboard`,
    },
    categories: ["trial-warning"],
  });
}

// ── Trial expired ─────────────────────────────────────────────────
export async function sendTrialExpiredEmail(to: string, businessName: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  return sendEmail({
    to,
    templateKey: "trial_expired",
    variables: {
      businessName,
      dashboardUrl: `${APP_URL}/dashboard`,
    },
    categories: ["trial-expired"],
  });
}

// ── Trial expiry (3 days before) ──────────────────────────────────
export async function sendTrialExpiryEmail(to: string, businessName: string, daysLeft: number): Promise<{ ok: boolean; id?: string; error?: string }> {
  return sendEmail({
    to,
    templateKey: "trial_expiry",
    variables: {
      businessName,
      daysLeft: String(daysLeft),
      dashboardUrl: `${APP_URL}/dashboard`,
    },
    categories: ["trial"],
  });
}

// ── New lead ──────────────────────────────────────────────────────
export async function sendNewLeadEmail(ownerEmail: string, businessName: string, leadName: string, leadPhone: string, leadInterest: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  return sendEmail({
    to: ownerEmail,
    templateKey: "new_lead",
    variables: {
      businessName,
      leadName,
      leadPhone,
      leadInterest,
      dashboardUrl: `${APP_URL}/dashboard`,
    },
    categories: ["lead"],
  });
}

// ── Weekly summary ────────────────────────────────────────────────
export async function sendWeeklySummaryEmail(to: string, businessName: string, stats: { calls: number; leads: number; minutes: number; smsSent: number }): Promise<{ ok: boolean; id?: string; error?: string }> {
  return sendEmail({
    to,
    templateKey: "weekly_summary",
    variables: {
      businessName,
      ...stats,
      dashboardUrl: `${APP_URL}/dashboard`,
    },
    categories: ["weekly"],
  });
}

// ── Payment confirmation ──────────────────────────────────────────
export async function sendPaymentConfirmationEmail(to: string, businessName: string, plan: string, amount: number): Promise<{ ok: boolean; id?: string; error?: string }> {
  return sendEmail({
    to,
    subject: `Potwierdzenie płatności WitaLine — ${(amount / 100).toFixed(2)} zł`,
    html: "",
    variables: { businessName },
    categories: ["payment"],
  });
}

// ── Payment confirmation with invoice PDF ────────────────────────
export async function sendInvoiceEmail(to: string, businessName: string, amount: number, invoiceUrl?: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  return sendEmail({
    to,
    templateKey: "invoice",
    variables: {
      businessName,
      amount: (amount / 100).toFixed(2),
      date: new Date().toLocaleDateString("pl-PL"),
      dashboardUrl: `${APP_URL}/dashboard`,
    },
    categories: ["invoice"],
  });
}

// ── Trial expired SMS text ───────────────────────────────────────
export function getTrialExpiredSmsText(): string {
  return `Okres probny WitaLine wygasl. Twoj asystent AI przestal odbierac telefony. Doladuj konto: ${APP_URL}/dashboard`;
}

// ── Payment failed ───────────────────────────────────────────────
export async function sendPaymentFailedEmail(to: string, businessName: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  return sendEmail({
    to,
    templateKey: "payment_failed",
    variables: {
      businessName,
      dashboardUrl: `${APP_URL}/dashboard`,
    },
    categories: ["payment-failed"],
  });
}
