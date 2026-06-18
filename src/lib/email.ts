import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "WitaLine <noreply@witaline.pl>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl";
const RESEND_KEY = process.env.RESEND_API_KEY;

function getResend(): Resend | null {
  if (!RESEND_KEY) return null;
  return new Resend(RESEND_KEY);
}

interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

// ── Welcome email after registration ──────────────────────────────────
export async function sendWelcomeEmail(
  to: string,
  businessName: string,
  plan: string
): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY not set" };

  const planLabel =
    plan === "start_100" ? "Start" :
    plan === "pro_500" ? "Growth" :
    plan === "enterprise_2000" ? "Enterprise" :
    plan === "elastic_0" ? "Elastyczny" :
    plan === "pro_249" ? "Pro" :
    plan === "lux_599" ? "Lux" : plan;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Witamy w WitaLine — Twoje konto ${businessName} jest aktywne!`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8faf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#3CBF4A,#2EA03A);padding:32px;text-align:center;">
      <h1 style="color:white;font-size:24px;margin:0;">WitaLine</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Automatyczna Recepcja AI</p>
    </div>
    <div style="padding:32px;">
      <h2 style="font-size:20px;color:#171717;margin:0 0 16px;">Cześć ${businessName}! 👋</h2>
      <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 24px;">
        Twoje konto zostało aktywowane. Twój asystent AI jest gotowy do pracy!
      </p>

      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="font-size:13px;color:#1C6323;margin:0 0 8px;font-weight:600;">Twój plan: ${planLabel}</p>
        <p style="font-size:13px;color:#52525b;margin:0;">Asystent AI odbiera telefony 24/7 i przyjmuje rezerwacje.</p>
      </div>

      <h3 style="font-size:15px;color:#171717;margin:0 0 12px;">Następne kroki:</h3>
      <ol style="font-size:14px;color:#52525b;line-height:1.8;margin:0 0 24px;padding-left:20px;">
        <li>Zaloguj się do panelu i sprawdź konfigurację</li>
        <li>Przetestuj rozmowę ze swoim asystentem</li>
        <li>Dodaj bazę wiedzy o swojej firmie</li>
        <li>Wklej widget czatu na swoją stronę www</li>
      </ol>

      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#3CBF4A;color:white;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;box-shadow:0 2px 8px rgba(60,191,74,0.3);">
        Przejdź do panelu →
      </a>

      <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;">
      <p style="font-size:12px;color:#a1a1aa;margin:0;">
        Masz pytania? Odpisz na tego maila lub odwiedź <a href="${APP_URL}/pomoc" style="color:#3CBF4A;">centrum pomocy</a>.
      </p>
    </div>
  </div>
</body>
</html>`,
    });

    if (error) {
      console.error("[email] welcome error:", error);
      return { ok: false, error: error.message };
    }
    console.log("[email] welcome sent:", data?.id);
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("[email] welcome exception:", err);
    return { ok: false, error: String(err) };
  }
}

// ── Trial expiry reminder (3 days before) ─────────────────────────────
export async function sendTrialExpiryEmail(
  to: string,
  businessName: string,
  daysLeft: number
): Promise<EmailResult> {
  try {
    const resend = getResend();
    if (!resend) return { ok: false, error: "RESEND_API_KEY not set" };
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Twój trial WitaLine kończy się za ${daysLeft} dni`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8faf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#3CBF4A,#2EA03A);padding:32px;text-align:center;">
      <h1 style="color:white;font-size:24px;margin:0;">WitaLine</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="font-size:20px;color:#171717;margin:0 0 16px;">Cześć ${businessName},</h2>
      <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 24px;">
        Twój <strong>7-dniowy okres próbny</strong> kończy się za <strong>${daysLeft} dni</strong>.
        Po jego zakończeniu asystent AI przestanie odbierać telefony.
      </p>

      <div style="background:#fef3c7;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="font-size:13px;color:#92400e;margin:0;font-weight:600;">⚠ Aby kontynuować, wybierz plan:</p>
        <p style="font-size:13px;color:#92400e;margin:8px 0 0;">Start 299 zł/mc · Growth 599 zł/mc · Enterprise 1199 zł/mc</p>
      </div>

      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#3CBF4A;color:white;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;box-shadow:0 2px 8px rgba(60,191,74,0.3);">
        Wybierz plan →
      </a>

      <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;">
      <p style="font-size:12px;color:#a1a1aa;margin:0;">
        Nie chcesz kontynuować? Nic nie rób — konto zostanie zawieszone po wygaśnięciu trialu.
      </p>
    </div>
  </div>
</body>
</html>`,
    });

    if (error) return { ok: false, error: error.message };
    console.log("[email] trial expiry sent:", data?.id);
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ── Payment confirmation ──────────────────────────────────────────────
export async function sendPaymentConfirmationEmail(
  to: string,
  businessName: string,
  plan: string,
  amount: number
): Promise<EmailResult> {
  const planLabel =
    plan === "start_100" ? "Start" :
    plan === "pro_500" ? "Growth" :
    plan === "enterprise_2000" ? "Enterprise" :
    plan === "elastic_0" ? "Elastyczny" :
    plan === "pro_249" ? "Pro" :
    plan === "lux_599" ? "Lux" : plan;

  try {
    const resend = getResend();
    if (!resend) return { ok: false, error: "RESEND_API_KEY not set" };
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Potwierdzenie płatności WitaLine — ${(amount / 100).toFixed(2)} zł`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8faf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#3CBF4A,#2EA03A);padding:32px;text-align:center;">
      <h1 style="color:white;font-size:24px;margin:0;">✓ Płatność potwierdzona</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 24px;">
        Otrzymaliśmy płatność za konto <strong>${businessName}</strong>.
      </p>

      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:14px;color:#71717a;">Plan</td>
          <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:14px;color:#171717;text-align:right;font-weight:600;">${planLabel}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:14px;color:#71717a;">Kwota</td>
          <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:14px;color:#171717;text-align:right;font-weight:600;">${(amount / 100).toFixed(2)} zł</td>
        </tr>
        <tr>
          <td style="padding:12px 0;font-size:14px;color:#71717a;">Data</td>
          <td style="padding:12px 0;font-size:14px;color:#171717;text-align:right;">${new Date().toLocaleDateString("pl-PL")}</td>
        </tr>
      </table>

      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#3CBF4A;color:white;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;">
        Panel →
      </a>
    </div>
  </div>
</body>
</html>`,
    });

    if (error) return { ok: false, error: error.message };
    console.log("[email] payment confirmation sent:", data?.id);
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ── Payment failed ────────────────────────────────────────────────────
export async function sendPaymentFailedEmail(
  to: string,
  businessName: string
): Promise<EmailResult> {
  try {
    const resend = getResend();
    if (!resend) return { ok: false, error: "RESEND_API_KEY not set" };
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Problem z płatnością — WitaLine`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8faf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#EF4444,#DC2626);padding:32px;text-align:center;">
      <h1 style="color:white;font-size:24px;margin:0;">⚠ Problem z płatnością</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 24px;">
        Nie udało się przetworzyć płatności za konto <strong>${businessName}</strong>.
        Prosimy o aktualizację danych płatności, aby uniknąć zawieszenia usługi.
      </p>

      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#EF4444;color:white;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;">
        Aktualizuj płatność →
      </a>

      <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;">
      <p style="font-size:12px;color:#a1a1aa;margin:0;">
        Jeśli płatność została wykonana, prosimy o kontakt: kontakt@witaline.pl
      </p>
    </div>
  </div>
</body>
</html>`,
    });

    if (error) return { ok: false, error: error.message };
    console.log("[email] payment failed sent:", data?.id);
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ── New lead notification to business owner ───────────────────────────
export async function sendNewLeadEmail(
  ownerEmail: string,
  businessName: string,
  leadName: string,
  leadPhone: string,
  leadInterest: string
): Promise<EmailResult> {
  try {
    const resend = getResend();
    if (!resend) return { ok: false, error: "RESEND_API_KEY not set" };
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `Nowy lead: ${leadName} — ${businessName}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8faf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#3CBF4A,#2EA03A);padding:24px 32px;">
      <h1 style="color:white;font-size:20px;margin:0;">📞 Nowy lead</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#52525b;margin:0 0 20px;">
        Twój asystent AI zebrał nowy lead:
      </p>

      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;font-size:13px;color:#71717a;">Imię</td>
          <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;font-size:13px;color:#171717;text-align:right;font-weight:500;">${leadName}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;font-size:13px;color:#71717a;">Telefon</td>
          <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;font-size:13px;color:#171717;text-align:right;"><a href="tel:${leadPhone}" style="color:#3CBF4A;text-decoration:none;">${leadPhone}</a></td>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:13px;color:#71717a;">Zainteresowanie</td>
          <td style="padding:10px 0;font-size:13px;color:#171717;text-align:right;">${leadInterest || "Ogólne"}</td>
        </tr>
      </table>

      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#3CBF4A;color:white;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">
        Zobacz w panelu →
      </a>
    </div>
  </div>
</body>
</html>`,
    });

    if (error) return { ok: false, error: error.message };
    console.log("[email] new lead sent:", data?.id);
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ── Weekly summary digest ─────────────────────────────────────────────
export async function sendWeeklySummaryEmail(
  to: string,
  businessName: string,
  stats: {
    calls: number;
    leads: number;
    minutes: number;
    smsSent: number;
  }
): Promise<EmailResult> {
  try {
    const resend = getResend();
    if (!resend) return { ok: false, error: "RESEND_API_KEY not set" };
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Podsumowanie tygodnia — ${businessName}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8faf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#3CBF4A,#2EA03A);padding:24px 32px;">
      <h1 style="color:white;font-size:20px;margin:0;">📊 Podsumowanie tygodnia</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">${businessName}</p>
    </div>
    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:16px;background:#f0fdf4;border-radius:12px 0 0 12px;text-align:center;">
            <p style="font-size:28px;font-weight:700;color:#1C6323;margin:0;">${stats.calls}</p>
            <p style="font-size:12px;color:#52525b;margin:4px 0 0;">Rozmów</p>
          </td>
          <td style="padding:16px;background:#f0fdf4;text-align:center;">
            <p style="font-size:28px;font-weight:700;color:#1C6323;margin:0;">${stats.leads}</p>
            <p style="font-size:12px;color:#52525b;margin:4px 0 0;">Leadów</p>
          </td>
          <td style="padding:16px;background:#f0fdf4;text-align:center;">
            <p style="font-size:28px;font-weight:700;color:#1C6323;margin:0;">${stats.minutes}</p>
            <p style="font-size:12px;color:#52525b;margin:4px 0 0;">Minut</p>
          </td>
          <td style="padding:16px;background:#f0fdf4;border-radius:0 12px 12px 0;text-align:center;">
            <p style="font-size:28px;font-weight:700;color:#1C6323;margin:0;">${stats.smsSent}</p>
            <p style="font-size:12px;color:#52525b;margin:4px 0 0;">SMS</p>
          </td>
        </tr>
      </table>

      <div style="text-align:center;margin:24px 0;">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#3CBF4A;color:white;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">
          Zobacz szczegóły →
        </a>
      </div>
    </div>
  </div>
</body>
</html>`,
    });

    if (error) return { ok: false, error: error.message };
    console.log("[email] weekly summary sent:", data?.id);
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
