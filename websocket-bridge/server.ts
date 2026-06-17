/**
 * WitaLine — ElevenLabs Sync Service
 *
 * PO WAŻNEJ INFORMACJI: ElevenLabs ma NATYWNĄ integrację z Twilio.
 * Nie potrzebujesz WebSocket Bridge! ElevenLabs sam konfiguruje Twilio.
 *
 * Ta usługa synchronizuje dane połączeń z ElevenLabs do Twojej bazy Supabase.
 *
 * Użycie:
 *   1. Stwórz agenta w https://elevenlabs.io/app/conversational-ai
 *   2. Importuj numer Twilio w zakładce Phone Numbers
 *   3. Uruchom: npm run dev (Next.js, nie potrzebujesz bridge'a)
 *
 * Alternatywnie: użyj ElevenLabs Events API do webhooka:
 *   Ustaw webhook URL w ElevenLabs dashboard → Conversations → Events
 *   POST https://twoja-domena.pl/api/elevenlabs/call-completed
 */

// TODO: Sync service - jeśli potrzebujesz pullować dane z ElevenLabs API
// const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations`, {
//   headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! }
// });
// const conversations = await res.json();
// for (const conv of conversations) {
//   // Upsert do call_logs w Supabase
// }




