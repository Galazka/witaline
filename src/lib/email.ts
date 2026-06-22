import { sendEmail, fetchInvoicePdf } from "@/lib/sendgrid";
import type { SendGridResult } from "@/lib/sendgrid";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl";

type EmailResult = SendGridResult;

function planLabel(plan: string): string {
  return (
    plan === "start_100" ? "Start" :
    plan === "pro_500" ? "Growth" :
    plan === "enterprise_2000" ? "Enterprise" :
    plan === "elastic_0" ? "Elastyczny" :
    plan === "pro_249" ? "Pro" :
    plan === "lux_599" ? "Lux" : plan
  );
}

function wrapper(inner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8faf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">${inner}</div></body></html>`;
}

function header(title: string): string {
  return `<div style="background:linear-gradient(135deg,#3CBF4A,#2EA03A);padding:32px;text-align:center;"><h1 style="color:white;font-size:24px;margin:0;">${title}</h1></div>`;
}

// ── Welcome email ──────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, businessName: string, plan: string): Promise<EmailResult> {
  const label = planLabel(plan);
  return sendEmail({
    to,
    subject: `Witamy w WitaLine — ${businessName} jest aktywne!`,
    html: wrapper(`
      ${header("WitaLine")}
      <div style="padding:32px;">
        <h2 style="font-size:20px;color:#171717;margin:0 0 16px;">Cześć ${businessName}!</h2>
        <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 24px;">Twoje konto zostalo aktywowane. Asystent AI jest gotowy do pracy!</p>
        <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:0 0 24px;">
          <p style="font-size:13px;color:#1C6323;margin:0 0 8px;font-weight:600;">Twoj plan: ${label}</p>
          <p style="font-size:13px;color:#52525b;margin:0;">Asystent AI odbiera telefony 24/7 i przyjmuje rezerwacje.</p>
        </div>
        <h3 style="font-size:15px;color:#171717;margin:0 0 12px;">Nastepne kroki:</h3>
        <ol style="font-size:14px;color:#52525b;line-height:1.8;margin:0 0 24px;padding-left:20px;">
          <li>Zaloguj sie do panelu i sprawdz konfiguracje</li>
          <li>Przetestuj rozmowe ze swoim asystentem</li>
          <li>Dodaj baze wiedzy o swojej firmie</li>
          <li>Wklej widget czatu na swoja strone www</li>
        </ol>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#3CBF4A;color:white;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;box-shadow:0 2px 8px rgba(60,191,74,0.3);">Przejdz do panelu →</a>
        <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;">
        <p style="font-size:12px;color:#a1a1aa;margin:0;">Masz pytania? Odpisz na tego maila.</p>
      </div>`),
    categories: ["welcome"],
  });
}

// ── Trial expiry ───────────────────────────────────────────────
export async function sendTrialExpiryEmail(to: string, businessName: string, daysLeft: number): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `Trial WitaLine konczy sie za ${daysLeft} dni`,
    html: wrapper(`
      ${header("WitaLine")}
      <div style="padding:32px;">
        <h2 style="font-size:20px;color:#171717;margin:0 0 16px;">Czesc ${businessName},</h2>
        <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 24px;">
          Twoj <strong>7-dniowy okres probny</strong> konczy sie za <strong>${daysLeft} dni</strong>.
          Po jego zakonczeniu asystent AI przestanie odbierac telefony.
        </p>
        <div style="background:#fef3c7;border-radius:12px;padding:20px;margin:0 0 24px;">
          <p style="font-size:13px;color:#92400e;margin:0;font-weight:600;">Aby kontynuowac, wybierz plan:</p>
          <p style="font-size:13px;color:#92400e;margin:8px 0 0;">Start 199 PLN/mc · Growth 399 PLN/mc · Lux 599 PLN/mc · Enterprise 999 PLN/mc</p>
        </div>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#3CBF4A;color:white;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;box-shadow:0 2px 8px rgba(60,191,74,0.3);">Wybierz plan →</a>
        <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;">
        <p style="font-size:12px;color:#a1a1aa;margin:0;">Nie chcesz kontynuowac? Nic nie rob konto zostanie zawieszone po wygasnieciu trialu.</p>
      </div>`),
    categories: ["trial"],
  });
}

// ── Payment confirmation ───────────────────────────────────────
export async function sendPaymentConfirmationEmail(to: string, businessName: string, plan: string, amount: number): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `Potwierdzenie platnosci WitaLine — ${(amount / 100).toFixed(2)} zl`,
    html: wrapper(`
      <div style="background:linear-gradient(135deg,#3CBF4A,#2EA03A);padding:32px;text-align:center;"><h1 style="color:white;font-size:24px;margin:0;">Platnosc potwierdzona</h1></div>
      <div style="padding:32px;">
        <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 24px;">Otrzymalismy platnosc za konto <strong>${businessName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
          <tr><td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:14px;color:#71717a;">Plan</td><td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:14px;color:#171717;text-align:right;font-weight:600;">${planLabel(plan)}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:14px;color:#71717a;">Kwota</td><td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:14px;color:#171717;text-align:right;font-weight:600;">${(amount / 100).toFixed(2)} zl</td></tr>
          <tr><td style="padding:12px 0;font-size:14px;color:#71717a;">Data</td><td style="padding:12px 0;font-size:14px;color:#171717;text-align:right;">${new Date().toLocaleDateString("pl-PL")}</td></tr>
        </table>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#3CBF4A;color:white;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;">Panel →</a>
      </div>`),
    categories: ["payment"],
  });
}

// ── Payment confirmation with invoice PDF ──────────────────────
export async function sendInvoiceEmail(to: string, businessName: string, amount: number, invoiceUrl?: string): Promise<EmailResult> {
  let attachments: { filename: string; content: string; type: string }[] | undefined;
  if (invoiceUrl) {
    const pdf = await fetchInvoicePdf(invoiceUrl);
    if (pdf) attachments = [{ ...pdf, type: "application/pdf" }];
  }
  return sendEmail({
    to,
    subject: `Faktura WitaLine — ${(amount / 100).toFixed(2)} zl`,
    html: wrapper(`
      <div style="background:linear-gradient(135deg,#3CBF4A,#2EA03A);padding:32px;text-align:center;"><h1 style="color:white;font-size:24px;margin:0;">Faktura</h1></div>
      <div style="padding:32px;">
        <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 24px;">Faktura dla <strong>${businessName}</strong> jest gotowa.</p>
        <div style="background:#f0fdf4;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
          <p style="font-size:28px;font-weight:700;color:#1C6323;margin:0;">${(amount / 100).toFixed(2)} zl</p>
          <p style="font-size:12px;color:#52525b;margin:4px 0 0;">${new Date().toLocaleDateString("pl-PL")}</p>
        </div>
        <p style="font-size:13px;color:#71717a;">Faktura w zalaczniku (PDF).</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#3CBF4A;color:white;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;margin-top:16px;">Panel →</a>
      </div>`),
    attachments,
    categories: ["invoice"],
  });
}

// ── Payment failed ─────────────────────────────────────────────
export async function sendPaymentFailedEmail(to: string, businessName: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `Problem z platnoscia — WitaLine`,
    html: wrapper(`
      <div style="background:linear-gradient(135deg,#EF4444,#DC2626);padding:32px;text-align:center;"><h1 style="color:white;font-size:24px;margin:0;">Problem z platnoscia</h1></div>
      <div style="padding:32px;">
        <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 24px;">Nie udalo sie przetworzyc platnosci za konto <strong>${businessName}</strong>. Prosze o aktualizacje danych platnosci.</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#EF4444;color:white;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;">Aktualizuj platnosc →</a>
        <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;">
        <p style="font-size:12px;color:#a1a1aa;margin:0;">Jesli masz pytania: kontakt@witaline.pl</p>
      </div>`),
    categories: ["payment-failed"],
  });
}

// ── New lead ───────────────────────────────────────────────────
export async function sendNewLeadEmail(ownerEmail: string, businessName: string, leadName: string, leadPhone: string, leadInterest: string): Promise<EmailResult> {
  return sendEmail({
    to: ownerEmail,
    subject: `Nowy lead: ${leadName} — ${businessName}`,
    html: wrapper(`
      <div style="background:linear-gradient(135deg,#3CBF4A,#2EA03A);padding:24px 32px;"><h1 style="color:white;font-size:20px;margin:0;">Nowy lead</h1></div>
      <div style="padding:32px;">
        <p style="font-size:15px;color:#52525b;margin:0 0 20px;">Twoj asystent AI zebral nowy lead:</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #f4f4f5;font-size:13px;color:#71717a;">Imie</td><td style="padding:10px 0;border-bottom:1px solid #f4f4f5;font-size:13px;color:#171717;text-align:right;font-weight:500;">${leadName}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f4f4f5;font-size:13px;color:#71717a;">Telefon</td><td style="padding:10px 0;border-bottom:1px solid #f4f4f5;font-size:13px;color:#171717;text-align:right;"><a href="tel:${leadPhone}" style="color:#3CBF4A;text-decoration:none;">${leadPhone}</a></td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#71717a;">Zainteresowanie</td><td style="padding:10px 0;font-size:13px;color:#171717;text-align:right;">${leadInterest || "Ogolne"}</td></tr>
        </table>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#3CBF4A;color:white;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">Zobacz w panelu →</a>
      </div>`),
    categories: ["lead"],
  });
}

// ── Weekly summary ─────────────────────────────────────────────
export async function sendWeeklySummaryEmail(to: string, businessName: string, stats: { calls: number; leads: number; minutes: number; smsSent: number }): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `Podsumowanie tygodnia — ${businessName}`,
    html: wrapper(`
      <div style="background:linear-gradient(135deg,#3CBF4A,#2EA03A);padding:24px 32px;"><h1 style="color:white;font-size:20px;margin:0;">Podsumowanie tygodnia</h1><p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">${businessName}</p></div>
      <div style="padding:32px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:16px;background:#f0fdf4;border-radius:12px 0 0 12px;text-align:center;"><p style="font-size:28px;font-weight:700;color:#1C6323;margin:0;">${stats.calls}</p><p style="font-size:12px;color:#52525b;margin:4px 0 0;">Rozmow</p></td>
            <td style="padding:16px;background:#f0fdf4;text-align:center;"><p style="font-size:28px;font-weight:700;color:#1C6323;margin:0;">${stats.leads}</p><p style="font-size:12px;color:#52525b;margin:4px 0 0;">Leadów</p></td>
            <td style="padding:16px;background:#f0fdf4;text-align:center;"><p style="font-size:28px;font-weight:700;color:#1C6323;margin:0;">${stats.minutes}</p><p style="font-size:12px;color:#52525b;margin:4px 0 0;">Minut</p></td>
            <td style="padding:16px;background:#f0fdf4;border-radius:0 12px 12px 0;text-align:center;"><p style="font-size:28px;font-weight:700;color:#1C6323;margin:0;">${stats.smsSent}</p><p style="font-size:12px;color:#52525b;margin:4px 0 0;">SMS</p></td>
          </tr>
        </table>
        <div style="text-align:center;margin:24px 0;"><a href="${APP_URL}/dashboard" style="display:inline-block;background:#3CBF4A;color:white;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">Zobacz szczegoly →</a></div>
      </div>`),
    categories: ["weekly"],
  });
}
