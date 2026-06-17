import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const NUMBER_COST_PLN = 30;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phoneNumber, businessId } = await request.json();

  if (!phoneNumber || !businessId) {
    return NextResponse.json({ error: "Missing phoneNumber or businessId" }, { status: 400 });
  }

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, owner_uid, twilio_number, balance")
    .eq("id", businessId)
    .eq("owner_uid", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  if (business.twilio_number) {
    return NextResponse.json({ error: "Firma ma już przypisany numer telefonu" }, { status: 400 });
  }

  const currentBalance = parseFloat(business.balance?.toString() || "0");
  if (currentBalance < NUMBER_COST_PLN) {
    return NextResponse.json({
      error: `Niewystarczające środki. Potrzebujesz ${NUMBER_COST_PLN} PLN, masz ${currentBalance.toFixed(2)} PLN. Doładuj konto w panelu.`,
      balance: currentBalance,
      required: NUMBER_COST_PLN,
    }, { status: 402 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/twilio/incoming`;

  if (!accountSid || !authToken) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 503 });
  }

  try {
    const params = new URLSearchParams({
      PhoneNumber: phoneNumber,
      VoiceUrl: webhookUrl,
      VoiceMethod: "POST",
      FriendlyName: `WitaLine - ${businessId}`,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.message || "Failed to purchase number" }, { status: 500 });
    }

    // Deduct balance
    const newBalance = currentBalance - NUMBER_COST_PLN;
    const { data: currentBiz } = await supabaseAdmin
      .from("businesses")
      .select("total_spent")
      .eq("id", businessId)
      .single();
    const currentSpent = parseFloat(currentBiz?.total_spent?.toString() || "0");
    const { error: deductErr } = await supabaseAdmin
      .from("businesses")
      .update({
        twilio_number: phoneNumber,
        balance: newBalance,
        total_spent: currentSpent + NUMBER_COST_PLN,
      })
      .eq("id", businessId);

    if (deductErr) {
      console.error("Balance deduct error:", deductErr);
    }

    // Log number purchase
    const { error: logErr } = await supabaseAdmin.from("number_purchases").insert({
      business_id: businessId,
      phone_number: phoneNumber,
      cost_pln: NUMBER_COST_PLN,
      twilio_sid: data.sid || "",
    });

    if (logErr) {
      console.error("Number purchase log error:", logErr);
    }

    return NextResponse.json({
      success: true,
      phoneNumber,
      sid: data.sid,
      cost: NUMBER_COST_PLN,
      balance_after: newBalance,
      monthlyPrice: data.monthly_cost,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
