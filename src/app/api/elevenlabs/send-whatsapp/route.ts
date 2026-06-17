import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsApp, WHATSAPP_CONTINUITY_TEMPLATES } from "@/lib/twilio-whatsapp";
import { addNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const params = body.parameters as Record<string, unknown> | undefined;

    const phone = params?.phone as string || (body.phone as string) || "";
    const message = params?.message as string || (body.message as string) || "";
    const template = (params?.template as string) || (body.template as string) || "default";
    const callLogId = (params?.call_log_id as string) || (body.call_log_id as string) || "";
    const businessId = (params?.business_id as string) || (body.business_id as string) || "";

    const name = (params?.name as string) || (body.name as string) || "!";
    const date = (params?.date as string) || (body.date as string) || "";
    const time = (params?.time as string) || (body.time as string) || "";
    const service = (params?.service as string) || (body.service as string) || "";
    const summary = (params?.summary as string) || (body.summary as string) || "";
    const planName = (params?.plan_name as string) || (body.plan_name as string) || "";
    const price = (params?.price as string) || (body.price as string) || "";
    const paymentLink = (params?.payment_link as string) || (body.payment_link as string) || "https://witaline.pl/cennik";
    const amount = (params?.amount as string) || (body.amount as string) || "";

    if (!phone) {
      return NextResponse.json({ ok: false, error: "Missing required field: phone" }, { status: 400 });
    }

    let text = message;

    if (!text && WHATSAPP_CONTINUITY_TEMPLATES[template as keyof typeof WHATSAPP_CONTINUITY_TEMPLATES]) {
      const tpl = WHATSAPP_CONTINUITY_TEMPLATES[template as keyof typeof WHATSAPP_CONTINUITY_TEMPLATES];

      switch (template) {
        case "booking": {
          const fn = WHATSAPP_CONTINUITY_TEMPLATES.booking;
          text = fn(name, date, time, service);
          break;
        }
        case "order": {
          const fn = WHATSAPP_CONTINUITY_TEMPLATES.order;
          text = fn(name, summary, paymentLink);
          break;
        }
        case "offer": {
          const fn = WHATSAPP_CONTINUITY_TEMPLATES.offer;
          text = fn(name, planName || "START", price || "299 zł", paymentLink);
          break;
        }
        case "payment_reminder": {
          const fn = WHATSAPP_CONTINUITY_TEMPLATES.payment_reminder;
          text = fn(name, paymentLink, amount);
          break;
        }
        default: {
          text = WHATSAPP_CONTINUITY_TEMPLATES.default(name);
        }
      }
    }

    if (!text) {
      text = WHATSAPP_CONTINUITY_TEMPLATES.default("!");
    }

    const result = await sendWhatsApp(phone, text, undefined, callLogId || undefined, businessId || undefined);

    if (businessId) {
      await addNotification({
        businessId,
        type: "system",
        title: "WhatsApp wysłany",
        message: `Wiadomość WhatsApp wysłana na ${phone}${template ? ` (${template})` : ""}`,
        metadata: { phone, template, text: text.slice(0, 100) },
      });
    }

    return NextResponse.json({
      ok: result.success,
      twilio_sid: result.twilioSid,
      error: result.error,
      message_preview: text.slice(0, 100),
    });
  } catch (err) {
    console.error("[send-whatsapp]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
