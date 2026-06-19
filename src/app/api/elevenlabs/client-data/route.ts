import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getActiveCallSids } from "@/lib/active-call-store";

const WITALINE_BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const callerId = body?.caller_id || "";
    const calledNumber = body?.called_number || "";
    const agentNumber = body?.phone_number?.agent_number || "";
    let businessId = WITALINE_BUSINESS_ID;
    let customVoiceId: string | null = null;

    // Look up business by agent number (Twilio number or ported number)
    const searchNumbers = [agentNumber, calledNumber].filter(Boolean);
    for (const num of searchNumbers) {
      // 1. Check twilio_number on businesses
      const { data: biz } = await supabaseAdmin
        .from("businesses")
        .select("id, voice_id")
        .eq("twilio_number", num)
        .maybeSingle();

      if (biz) {
        businessId = biz.id;
        if (biz.voice_id) {
          const { data: voice } = await supabaseAdmin
            .from("voices")
            .select("elevenlabs_voice_id")
            .eq("id", biz.voice_id)
            .maybeSingle();
          if (voice) {
            customVoiceId = voice.elevenlabs_voice_id;
          }
        }
        break;
      }

      // 2. Check port_requests (ported numbers)
      const { data: portReq } = await supabaseAdmin
        .from("port_requests")
        .select("business_id")
        .eq("phone_number", num)
        .eq("status", "completed")
        .maybeSingle();

      if (portReq) {
        const { data: biz2 } = await supabaseAdmin
          .from("businesses")
          .select("id, voice_id")
          .eq("id", portReq.business_id)
          .maybeSingle();
        if (biz2) {
          businessId = biz2.id;
          if (biz2.voice_id) {
            const { data: voice } = await supabaseAdmin
              .from("voices")
              .select("elevenlabs_voice_id")
              .eq("id", biz2.voice_id)
              .maybeSingle();
            if (voice) {
              customVoiceId = voice.elevenlabs_voice_id;
            }
          }
        }
        break;
      }
    }

    // Try callSid from webhook body first, fall back to active-call-store by businessId
    let callSid = body?.call_sid || "";
    if (!callSid) {
      const sids = getActiveCallSids(businessId);
      callSid = sids.length > 0 ? sids[sids.length - 1] : "";
    }

    // Build response — ONLY override TTS if business has a custom voice
    // Otherwise let ElevenLabs use the agent-level voice (set via sync_elevenlabs)
    const response: Record<string, unknown> = {
      type: "conversation_initiation_client_data",
      dynamic_variables: {
        businessId: businessId,
        caller_number: callerId,
        called_number: calledNumber,
        agent_number: agentNumber,
        from_number: callerId,
        call_sid: callSid,
      },
    };

    if (customVoiceId) {
      (response as any).conversation_config_override = {
        tts: { voice_id: customVoiceId },
      };
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        type: "conversation_initiation_client_data",
        dynamic_variables: {
          businessId: WITALINE_BUSINESS_ID,
          caller_number: "",
          called_number: "",
          agent_number: "",
          from_number: "",
        },
      },
      { status: 200 }
    );
  }
}
