import { supabaseAdmin } from "./supabase-admin";

interface SlackMessage {
  text: string;
  blocks?: unknown[];
}

export async function sendSlackNotification(
  businessId: string,
  message: SlackMessage,
): Promise<boolean> {
  if (!businessId) return false;

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("slack_webhook_url, name")
    .eq("id", businessId)
    .single();

  const webhookUrl = biz?.slack_webhook_url;
  if (!webhookUrl) return false;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[${biz.name || "WitaLine"}] ${message.text}`,
        blocks: message.blocks,
        username: "WitaLine Bot",
        icon_emoji: ":robot_face:",
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[slack-notify] failed:", err);
    return false;
  }
}

export function leadSlackBlocks(lead: {
  name: string;
  phone?: string;
  email?: string;
  interest?: string;
  notes?: string;
}) {
  return {
    text: `Nowy lead: ${lead.name}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "Nowy lead 📋", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Imię:*\n${lead.name}` },
          { type: "mrkdwn", text: `*Telefon:*\n${lead.phone || "—"}` },
          { type: "mrkdwn", text: `*Email:*\n${lead.email || "—"}` },
          { type: "mrkdwn", text: `*Zainteresowanie:*\n${lead.interest || "—"}` },
        ],
      },
      ...(lead.notes ? [{
        type: "section",
        text: { type: "mrkdwn", text: `*Notatki:*\n${lead.notes}` },
      }] : []),
      {
        type: "divider",
      },
    ],
  };
}

export function reservationSlackBlocks(reservation: {
  callerName: string;
  callerPhone?: string;
  serviceType: string;
  reservedAt: string;
  notes?: string;
}) {
  return {
    text: `Nowa rezerwacja: ${reservation.serviceType} - ${reservation.callerName}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "Nowa rezerwacja 📅", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Klient:*\n${reservation.callerName}` },
          { type: "mrkdwn", text: `*Telefon:*\n${reservation.callerPhone || "—"}` },
          { type: "mrkdwn", text: `*Usługa:*\n${reservation.serviceType}` },
          { type: "mrkdwn", text: `*Termin:*\n${reservation.reservedAt}` },
        ],
      },
      ...(reservation.notes ? [{
        type: "section",
        text: { type: "mrkdwn", text: `*Notatki:*\n${reservation.notes}` },
      }] : []),
      {
        type: "divider",
      },
    ],
  };
}
