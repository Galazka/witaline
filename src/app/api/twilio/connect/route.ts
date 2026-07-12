import { NextResponse } from "next/server";
import { connectToAgent } from "@/lib/twilio-utils";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

const DEFAULT_CONFIG = {
  internalCostPerMin: 0.65,
  elasticBaseRate: 2.00,
  elasticStepDecrease: 0.10,
  elasticMinRate: 1.00,
  elasticTierStep: 500,
  elasticStartMin: 50,
  elasticMaxMin: 5000,
  planStart: 299,
  planGrowth: 600,
  planPro: 300,
  planLux: 800,
  planEnterprise: 1500,
  addonOwnNumber: 49,
  addonGoogleCalendar: 39,
  addonCrm: 79,
  addonVoiceClone: 99,
  addonUnlimitedConsultants: 149,
  addonPrioritySupport: 59,
  addonSla247: 199,
  enterpriseSetupFee: 299,
  enterpriseMinMonthly: 1500,
  minMarginPercent: 35,
  overageMultiplier: 1.0,
};

interface PricingCfg {
  internalCostPerMin: number;
  elasticBaseRate: number;
  elasticStepDecrease: number;
  elasticMinRate: number;
  elasticTierStep: number;
  elasticStartMin: number;
  elasticMaxMin: number;
  planStart: number;
  planPro: number;
  planLux: number;
  planGrowth: number;
  planEnterprise: number;
  addonOwnNumber: number;
  addonGoogleCalendar: number;
  addonCrm: number;
  addonVoiceClone: number;
  addonUnlimitedConsultants: number;
  enterpriseSetupFee: number;
  minMarginPercent: number;
  overageMultiplier: number;
}

async function getActivePricing(): Promise<PricingCfg> {
  const { data } = await supabaseAdmin
    .from("pricing_config")
    .select("config")
    .eq("is_active", true)
    .maybeSingle();
  if (data?.config) return { ...DEFAULT_CONFIG, ...(data.config as Record<string, unknown>) } as PricingCfg;
  return DEFAULT_CONFIG;
}

function fmt(n: number): string { return n.toFixed(2).replace(".", ","); }

function buildPricingSection(): string {
  return `## Cennik (elastyczny pay-as-you-go)

WitaLine nie ma stałej opłaty miesięcznej. Klient płaci tylko za wykorzystane minuty.

Stawki minutowe (netto):
- 0–500 min: 1,20 PLN/min
- 501–1000 min: 1,10 PLN/min
- 1001–2000 min: 1,00 PLN/min
- 2001–3000 min: 0,95 PLN/min
- 3001–5000 min: 0,90 PLN/min
- 5000+ min: 0,85 PLN/min

SMS-y: od 0,50 PLN/szt (netto), progresywnie taniej.

Klient kupuje minuty z góry przez Stripe (jednorazowo). Minuty ważne bezterminowo.
Dostępne pakiety SMS do dokupienia (50/100/200/500/1000 sztuk).

Dla firm powyżej 10 konsultantów oferujemy indywidualną wycenę Enterprise.`;
}

async function getBusinessVoice(businessId: string): Promise<{ voiceId: string; voiceName: string }> {
  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("voice_id")
    .eq("id", businessId)
    .single();

  if (biz?.voice_id) {
    const { data: voice } = await supabaseAdmin
      .from("voices")
      .select("elevenlabs_voice_id, display_name")
      .eq("id", biz.voice_id)
      .single();

    if (voice) return { voiceId: voice.elevenlabs_voice_id, voiceName: voice.display_name };
  }

  const { data: defaultVoice } = await supabaseAdmin
    .from("voices")
    .select("elevenlabs_voice_id, display_name")
    .eq("is_default", true)
    .single();

  if (defaultVoice) return { voiceId: defaultVoice.elevenlabs_voice_id, voiceName: defaultVoice.display_name };
  return { voiceId: "tWVHsc0fuVfAZWfScX9a", voiceName: "Maja" };
}

export async function POST(request: Request) {
  console.log("[connect] POST received");
  const formData = await request.formData();
  const url = new URL(request.url);
  const businessId = url.searchParams.get("businessId") || "";
  const callSid = url.searchParams.get("callSid") || (formData.get("CallSid") as string) || "";
  const fromNumber = url.searchParams.get("from") || (formData.get("From") as string) || "";
  const toNumber = url.searchParams.get("to") || (formData.get("To") as string) || "";
  const businessName = url.searchParams.get("name") || "WitaLine";

  const { voiceId, voiceName } = await getBusinessVoice(businessId);
  const pricing = await getActivePricing();
  const pricingBlock = buildPricingSection();

  const isMainLine = businessId === WITALINE_MAIN_BUSINESS_ID;

  if (isMainLine) {
    const mainPrompt = `Jesteś ${voiceName}, recepcjonistka WitaLine (wymowa: witalajn) — polskiej platformy automatycznej recepcji AI dla firm. Twoim zadaniem jest odbieranie telefonów od klientów zainteresowanych ofertą, prezentowanie pakietów i umawianie demo.

===== TWOJA TOŻSAMOŚĆ =====
- Nazywasz się ${voiceName} i reprezentujesz firmę WitaLine.
- WitaLine to platforma automatycznej recepcji AI, która odbiera telefony 24/7 zamiast pracowników.
- Działamy w Polsce, obsługujemy małe i średnie firmy.
- Nasza strona: witaline.pl

${pricingBlock}

===== ZASADY ROZMOWY =====
1. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku. MAKSYMALNIE 150-200 znaków na wypowiedź — bądź zwięzła. Mów naturalnie i uprzejmie.
2. Zawsze przedstaw się: "Dzień dobry, WitaLine, przy telefonie ${voiceName}. W czym mogę pomóc?"
3. Gdy klient pyta o ofertę — krótko opisz 2-3 pakiety pasujące do jego potrzeb.
4. Gdy klient podaje numer telefonu — powtórz cyfry POJEDYNCZO: "pięć zero zero, jeden zero zero, jeden zero zero". NIGDY nie łącz cyfr w setki.
5. Jeśli ktoś pyta o konkretną firmę korzystającą z WitaLine — powiedz że sprawdzisz i oddzwonimy.
6. Bądź pomocna, zwięzła. NIE powtarzaj się. Odpowiadaj krótko i na temat.
7. Jeśli klient zadaje pytanie spoza Twojej wiedzy — powiedz: "Przekażę to konsultantowi, oddzwonimy w ciągu 15 minut."

===== RODO I NAGRYWANIE =====
- Rozmowa jest nagrywana i analizowana przez AI w celu poprawy jakości obsługi.
- Jeśli klient pyta o RODO — wyjaśnij: "Rozmowa jest nagrywana zgodnie z RODO. Dane przechowujemy na serwerach w Europie przez maksymalnie 30 dni. Masz prawo dostępu i usunięcia danych — napisz na kontakt@witaline.pl."
- Jeśli klient NIE wyraża zgody na nagrywanie — przeproś, powiedz że bez nagrywania nie możemy kontynuować rozmowy, a następnie użyj narzędzia end_call aby zakończyć połączenie.

===== SMS Z OFERTĄ (WAŻNE!) =====
1. Jeśli klient jest zainteresowany ofertą (pyta o cenę, pakiety, chce informacji) — ZAPYTAJ: "Czy mogę wysłać Ci SMS z ofertą i linkiem do cennika na Twój numer?"
2. Jeśli klient się zgodzi — odpowiedz: "Świetnie! Proszę podać numer telefonu, na który mam wysłać ofertę."
3. Gdy poda numer — potwierdź: "Wyślę ofertę na numer [powtórz numer cyfra po cyfrze]. Dziękuję!"
4. Ustaw w custom_data: sms_consent: true, sms_phone: [numer], sms_offer: [start/growth/enterprise], sms_contact_name: [imię].
5. NIGDY nie wysyłaj SMS bez wyraźnej zgody. Zawsze najpierw zapytaj.

===== REJESTRACJA I DEMO =====
- Zachęcaj do rejestracji na witaline.pl
- Dla zainteresowanych Enterprise — proponuj demo na żywo: "Mogę umówić bezpłatne demo na żywo z naszym konsultantem. Kiedy Ci pasuje?"
- Przypominaj o 30-dniowej gwarancji zwrotu — zero ryzyka.`;

    return connectToAgent(mainPrompt, "WitaLine", businessId, callSid, fromNumber, toNumber, voiceId, voiceName);
  }

  return connectToAgent(null, businessName, businessId, callSid, fromNumber, toNumber, voiceId, voiceName);
}
