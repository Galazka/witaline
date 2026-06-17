import { supabaseAdmin } from "@/lib/supabase-admin";
import { connectToAgent, escapeXml, twiml } from "@/lib/twilio-utils";

export async function POST(request: Request) {
  const formData = await request.formData();
  const digits = formData.get("Digits") as string;
  const callerId = formData.get("From") as string;
  const toNumber = formData.get("To") as string;
  const callSid = formData.get("CallSid") as string;

  if (!digits) {
    return twiml(`<Say language="pl-PL">Nie wykryto wyboru. Do widzenia.</Say><Hangup/>`);
  }

  // === OPTION 1: Oferta WitaLine ===
  if (digits === "1") {
    const salesPrompt = `Jesteś asystentem sprzedażowym WitaLine — polskiej platformy automatycznej recepcji AI. 
Twoim zadaniem jest przedstawianie oferty firmom dzwoniącym. Mów krótko i rzeczowo.
Plany: Start 79 zł/mies (100 min), Pro 249 zł/mies (500 min), Enterprise 599 zł/mies (2000 min).
14 dni darmowego testu bez karty kredytowej.
Zachęć do rejestracji na stronie witaline.pl. Jeśli klient ma pytania techniczne, odpowiadaj rzetelnie.
Jeśli klient chce rozmawiać z człowiekiem, powiedz że przekażesz prośbę i oddzwonimy.`;
    return connectToAgent(salesPrompt, "WitaLine", "witaline-sales", callSid, callerId, toNumber);
  }

  // === OPTION 2: Prośba o oddzwonienie ===
  if (digits === "2") {
    return twiml(`
      <Say language="pl-PL">Opisz krótko swoją sprawę po sygnale.</Say>
      <Gather input="speech" action="/api/twilio/ivr-callback" method="POST" timeout="5" speechTimeout="auto" language="pl-PL">
        <Say language="pl-PL">Mów po sygnale.</Say>
      </Gather>
      <Say language="pl-PL">Nie wykryto wiadomości. Oddzwonimy na numer ${escapeXml(callerId)}.</Say>
      <Hangup/>
    `);
  }

  // === OPTION 3 (*NR): Połączenie z firmą po extension ===
  if (digits.startsWith("*")) {
    const ext = digits.slice(1);

    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("extension", ext)
      .single();

    if (!business) {
      return twiml(
        `<Say language="pl-PL">Nie znaleziono firmy o kodzie ${escapeXml(ext)}. Sprawdź numer i spróbuj ponownie.</Say><Hangup/>`
      );
    }

    if (business.suspended) {
      return twiml(
        `<Say language="pl-PL">Konto firmy ${escapeXml(business.name)} jest chwilowo nieaktywne.</Say><Hangup/>`
      );
    }

    return connectToAgent(business.system_prompt, business.name, business.id, callSid, callerId, toNumber);
  }

  // === DOMYŚLNIE ===
  return twiml(`<Say language="pl-PL">Nieprawidłowy wybór. Do widzenia.</Say><Hangup/>`);
}
