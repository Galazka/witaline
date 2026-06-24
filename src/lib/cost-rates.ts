/**
 * Cost rates — single source of truth for all provider pricing.
 *
 * All PLN values are NETTO (before VAT).
 * USD values are raw from provider APIs.
 *
 * IMPORTANT: Update these when provider prices change.
 */

// ─── Exchange rate ────────────────────────────────────────────────
// Średni kurs USD/PLN — ustawiany ręcznie lub z API NBP
export const USD_TO_PLN = 4.15;

// ─── ElevenLabs (Conversational AI) ───────────────────────────────
// Pricing: $0.045/min ElevenLabs voice + $0.005/min infrastructure + LLM
// Approx: ~$0.09/min total (varies by model)
// Source: https://elevenlabs.io/pricing
export const ELEVENLABS_COST_PER_MIN_USD = 0.09;
export const ELEVENLABS_COST_PER_MIN_PLN = Math.round(ELEVENLABS_COST_PER_MIN_USD * USD_TO_PLN * 1000) / 1000;

// ─── Twilio Voice (Poland) ────────────────────────────────────────
// Source: https://www.twilio.com/en-us/voice/pricing
// Poland mobile outbound: ~$0.0457/min
// Poland landline outbound: ~$0.022/min
// Inbound (receiving calls on Polish number): included in number rental (~$1/month)
export const TWILIO_POLAND_MOBILE_COST_PER_MIN_USD = 0.0457;
export const TWILIO_POLAND_LANDLINE_COST_PER_MIN_USD = 0.022;
export const TWILIO_POLAND_MOBILE_COST_PER_MIN_PLN = Math.round(TWILIO_POLAND_MOBILE_COST_PER_MIN_USD * USD_TO_PLN * 1000) / 1000;
export const TWILIO_POLAND_LANDLINE_COST_PER_MIN_PLN = Math.round(TWILIO_POLAND_LANDLINE_COST_PER_MIN_USD * USD_TO_PLN * 1000) / 1000;

// Fallback average when caller number type is unknown
export const TWILIO_AVG_COST_PER_MIN_PLN = Math.round(((TWILIO_POLAND_MOBILE_COST_PER_MIN_PLN + TWILIO_POLAND_LANDLINE_COST_PER_MIN_PLN) / 2) * 1000) / 1000;

// ─── OpenRouter (LLM) ─────────────────────────────────────────────
// Very small cost: ~$0.0003/min (negligible)
export const OPENROUTER_COST_PER_MIN_USD = 0.0003;
export const OPENROUTER_COST_PER_MIN_PLN = Math.round(OPENROUTER_COST_PER_MIN_USD * USD_TO_PLN * 1000) / 1000;

// ─── Twilio SMS (Poland outbound) ─────────────────────────────────
// Source: https://www.twilio.com/en-us/sms/pricing
// ~$0.0457/SMS segment to Poland
export const TWILIO_SMS_COST_PER_SEGMENT_USD = 0.0457;
export const TWILIO_SMS_COST_PER_SEGMENT_PLN = Math.round(TWILIO_SMS_COST_PER_SEGMENT_USD * USD_TO_PLN * 1000) / 1000;

// ─── Consultant transfer ──────────────────────────────────────────
// When call is transferred to human consultant, Twilio dials out from our number.
// Same rate as Twilio outbound to Poland mobile (conservative estimate).
export const CONSULTANT_TRANSFER_COST_PER_MIN_PLN = TWILIO_POLAND_MOBILE_COST_PER_MIN_PLN;

// ─── Internal cost per minute (for `internal_cost_pln` field) ─────
// This is what we actually pay per minute of AI conversation:
// ElevenLabs voice + OpenRouter LLM + Twilio connection
export const AI_CALL_COST_PER_MIN_PLN = Math.round(
  (ELEVENLABS_COST_PER_MIN_PLN + OPENROUTER_COST_PER_MIN_PLN + TWILIO_AVG_COST_PER_MIN_PLN) * 1000
) / 1000;

// ─── Summary ──────────────────────────────────────────────────────
export const COST_SUMMARY = {
  usdToPln: USD_TO_PLN,
  elevenlabsPerMinUsd: ELEVENLABS_COST_PER_MIN_USD,
  elevenlabsPerMinPln: ELEVENLABS_COST_PER_MIN_PLN,
  twilioMobilePerMinPln: TWILIO_POLAND_MOBILE_COST_PER_MIN_PLN,
  twilioLandlinePerMinPln: TWILIO_POLAND_LANDLINE_COST_PER_MIN_PLN,
  twilioAvgPerMinPln: TWILIO_AVG_COST_PER_MIN_PLN,
  openrouterPerMinPln: OPENROUTER_COST_PER_MIN_PLN,
  smsPerSegmentPln: TWILIO_SMS_COST_PER_SEGMENT_PLN,
  consultantTransferPerMinPln: CONSULTANT_TRANSFER_COST_PER_MIN_PLN,
  aiCallPerMinPln: AI_CALL_COST_PER_MIN_PLN,
};
