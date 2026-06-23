"use client";

import { useState } from "react";
import WidgetSettings from "./WidgetSettings";
import WebhookApiSettings from "./WebhookApiSettings";
import GoogleCalendarSettings from "./GoogleCalendarSettings";
import IntegrationsSettings from "./IntegrationsSettings";

interface Props {
  businessId: string;
}

const CRM_LIST = [
  {
    id: "hubspot",
    name: "HubSpot",
    desc: "Zapisuj kontakty, loguj rozmowy i aktualizuj deal w czasie rzeczywistym. Automatycznie twórz zadania po rozmowie.",
    status: "planowane",
    webhookUrl: "/api/integrations/hubspot/webhook",
    docsUrl: "https://developers.hubspot.com/docs/api/webhooks",
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    desc: "Twórz deal, dodawaj notatki i aktualizuj etapy sprzedaży głosem. Synchronizacja dwukierunkowa kontaktów.",
    status: "planowane",
    webhookUrl: "/api/integrations/pipedrive/webhook",
    docsUrl: "https://pipedrive.readme.io/docs/guide-for-webhooks",
  },
  {
    id: "livespace",
    name: "Livespace",
    desc: "Synchronizuj rozmowy z systemem CRM — kontakty, deal i aktywności. Wszystko automatycznie po rozmowie.",
    status: "planowane",
    webhookUrl: "/api/integrations/livespace/webhook",
    docsUrl: "https://developers.livespace.io/",
  },
];

const API_ENDPOINTS = [
  { method: "GET", path: "/api/v1/calls", desc: "Lista połączeń (call_logs)" },
  { method: "GET", path: "/api/v1/calls/:id", desc: "Szczegóły połączenia" },
  { method: "GET", path: "/api/v1/leads", desc: "Lista leadów" },
  { method: "POST", path: "/api/v1/leads", desc: "Utwórz lead" },
  { method: "GET", path: "/api/v1/business", desc: "Profil firmy i statystyki" },
  { method: "POST", path: "/api/v1/sms", desc: "Wyślij SMS" },
  { method: "POST", path: "/api/v1/whatsapp", desc: "Wyślij WhatsApp" },
  { method: "POST", path: "/api/v1/trigger-call", desc: "Zainicjuj rozmowę AI" },
];

const BOT_CAPABILITIES = [
  { icon: "📞", title: "Odbieranie połączeń", desc: "AI odbiera wszystkie połączenia 24/7, wita klienta i prowadzi rozmowę zgodnie z instrukcją Twojej firmy." },
  { icon: "📅", title: "Rezerwacje i kalendarz", desc: "Sprawdza dostępność w Google Calendar i umawia wizyty bez angażowania człowieka." },
  { icon: "📋", title: "Zbieranie leadów", desc: "Zapisuje dane kontaktowe, kwalifikuje leady i wysyła powiadomienie na Slack/email." },
  { icon: "🏷️", title: "Kategoryzacja rozmów", desc: "Klasyfikuje każdą rozmowę: zamówienie, oferta, pytanie, rezerwacja, spam." },
  { icon: "📊", title: "Generowanie ofert", desc: "Może wysłać ofertę cenową SMS-em lub WhatsApp na podstawie rozmowy." },
  { icon: "🔀", title: "Transfer do człowieka", desc: "Jeśli sobie nie radzi lub klient o to poprosi — przekazuje do konsultanta." },
  { icon: "⭐", title: "Ocena jakości", desc: "Każda rozmowa jest oceniana (1-10) przez AI pod kątem profesjonalizmu i skuteczności." },
  { icon: "📝", title: "Transkrypcja i podsumowanie", desc: "Zapisuje pełną transkrypcję + AI-generowane podsumowanie po każdej rozmowie." },
  { icon: "💬", title: "WhatsApp Continuity", desc: "Po rozmowie wysyła podsumowanie, link do ankiety lub ofertę przez WhatsApp." },
  { icon: "🔗", title: "Integracja z CRM", desc: "HubSpot, Pipedrive, Livespace — automatyczne logowanie rozmów i aktualizacja kontaktów." },
];

const WEBHOOK_EVENTS = [
  { event: "call.completed", desc: "Po zakończeniu rozmowy — transkrypcja, podsumowanie, koszt, ocena" },
  { event: "lead.created", desc: "Nowy lead zapisany przez AI podczas rozmowy" },
  { event: "reservation.created", desc: "Nowa rezerwacja w kalendarzu" },
  { event: "sms.sent", desc: "SMS wysłany przez AI lub automat" },
  { event: "whatsapp.sent", desc: "Wiadomość WhatsApp wysłana" },
];

export default function IntegrationsDashboard({ businessId }: Props) {
  const [activeSection, setActiveSection] = useState<string>("bot");
  const [integrationFilter, setIntegrationFilter] = useState("all");

  const sections = [
    { key: "bot", label: "Jak działa bot" },
    { key: "widget", label: "Widget na stronę" },
    { key: "api", label: "API" },
    { key: "webhooks", label: "Webhooki" },
    { key: "crm", label: "CRM" },
    { key: "settings", label: "Ustawienia integracji" },
  ];

  const origin = typeof window !== "undefined" ? window.location.origin : "https://witaline.pl";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Section nav */}
      <div className="flex flex-wrap gap-1 bg-brand-50 p-1 rounded-xl">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition ${
              activeSection === s.key
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Bot capabilities ── */}
      {activeSection === "bot" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Jak działa WitaLine Bot</h2>
            <p className="text-sm text-zinc-500 mt-1">
              WitaLine to automatyczna recepcja AI, która odbiera połączenia za Ciebie 24/7.
              Twój klient dzwoni — asystentka Maja (głos Maja) prowadzi rozmowę, odpowiada na pytania,
              umawia wizyty, zbiera leady i przekazuje do konsultanta gdy trzeba.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {BOT_CAPABILITIES.map((cap) => (
              <div key={cap.title} className="bg-white rounded-xl border border-zinc-200 p-4 hover:border-brand-200 transition">
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{cap.icon}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900">{cap.title}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{cap.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-brand-50 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-zinc-900 mb-2">Jak to działa krok po kroku?</h4>
            <ol className="space-y-2 text-sm text-zinc-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-brand-400 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <span>Klient dzwoni na Twój numer — Maja odbiera automatycznie</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-brand-400 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <span>Maja identyfikuje intencję: pytanie, zamówienie, rezerwacja, oferta</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-brand-400 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <span>Jeśli potrzebne — sprawdza kalendarz, zapisuje lead, wysyła ofertę SMS/WhatsApp</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-brand-400 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
                <span>W razie potrzeby przekazuje do konsultanta (Ciebie lub Twojego zespołu)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-brand-400 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">5</span>
                <span>Po rozmowie: transkrypcja, podsumowanie AI, ocena jakości, WhatsApp continuity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-brand-400 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">6</span>
                <span>Dane trafiają do CRM, na Slacka, do Twojego webhooka — wszystko automatycznie</span>
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* ── Widget ── */}
      {activeSection === "widget" && (
        <WidgetSettings businessId={businessId} />
      )}

      {/* ── API ── */}
      {activeSection === "api" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">REST API v1</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Programistyczny dostęp do danych WitaLine. Użyj klucza API z sekcji webhook poniżej.
              Wszystkie zapytania wymagają nagłówka <code className="text-brand-500 bg-brand-50 px-1 rounded">Authorization: Bearer {`<klucz>`}</code>
            </p>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="p-4 bg-zinc-50 border-b border-zinc-200">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Endpointy</p>
            </div>
            <div className="divide-y divide-zinc-100">
              {API_ENDPOINTS.map((ep) => (
                <div key={ep.path} className="flex items-start gap-4 px-4 py-3 hover:bg-brand-50/50 transition">
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${
                    ep.method === "GET"
                      ? "bg-green-100 text-green-700"
                      : ep.method === "POST"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {ep.method}
                  </span>
                  <div className="min-w-0">
                    <code className="text-xs font-mono text-zinc-800">{ep.path}</code>
                    <p className="text-xs text-zinc-400 mt-0.5">{ep.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-50 rounded-xl p-4">
            <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Przykład</p>
            <pre className="text-xs font-mono text-zinc-700 overflow-x-auto">{`curl -H "Authorization: Bearer wl_twój_klucz" \\
  ${origin}/api/v1/calls?limit=10`}</pre>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <p className="text-xs text-amber-800">
              <strong>Uwaga:</strong> API jest w fazie rozwojowej. Endpointy i format odpowiedzi mogą się zmieniać.
              Sugerujemy użycie webhooków do otrzymywania danych w czasie rzeczywistym.
            </p>
          </div>
        </div>
      )}

      {/* ── Webhooks ── */}
      {activeSection === "webhooks" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Webhooki (wychodzące)</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Dla klientów Enterprise — wysyłamy zdarzenia na Twój serwer HTTP w czasie rzeczywistym.
              Skonfiguruj URL webhooka w sekcji poniżej.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="p-4 bg-zinc-50 border-b border-zinc-200">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Zdarzenia</p>
            </div>
            <div className="divide-y divide-zinc-100">
              {WEBHOOK_EVENTS.map((ev) => (
                <div key={ev.event} className="flex items-start gap-3 px-4 py-3">
                  <code className="shrink-0 text-[10px] font-mono bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-medium">{ev.event}</code>
                  <p className="text-xs text-zinc-500">{ev.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <WebhookApiSettings businessId={businessId} />
        </div>
      )}

      {/* ── CRM ── */}
      {activeSection === "crm" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Integracje CRM</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Podłącz swój CRM aby automatycznie logować rozmowy, aktualizować kontakty i tworzyć deale.
              W planie Enterprise konfigurujemy integrację za Ciebie.
            </p>
          </div>

          <div className="grid gap-4">
            {CRM_LIST.map((crm) => (
              <div key={crm.id} className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-zinc-900">{crm.name}</h3>
                      {crm.status === "aktywne" ? (
                        <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">Aktywne</span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">Planowane</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">{crm.desc}</p>
                  </div>
                  <div className="shrink-0">
                    {crm.status === "aktywne" ? (
                      <button className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">Rozłącz</button>
                    ) : (
                      <span className="text-xs px-3 py-1.5 bg-zinc-100 text-zinc-400 rounded-lg">Wkrótce</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-[10px]">
                  <a href={crm.docsUrl} target="_blank" rel="noopener noreferrer"
                    className="text-brand-500 hover:text-brand-600 font-medium">
                    Dokumentacja →
                  </a>
                  <span className="text-zinc-300">|</span>
                  <span className="text-zinc-400">
                    Webhook: <code className="font-mono text-zinc-500">{origin}{crm.webhookUrl}</code>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-brand-50 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-zinc-900 mb-2">Potrzebujesz innej integracji?</h4>
            <p className="text-xs text-zinc-500 mb-3">
              Mamy API które pozwala zintegrować WitaLine z dowolnym systemem.
              Dla klientów Enterprise budujemy dedykowane integracje.
            </p>
            <p className="text-xs text-zinc-400">
              Skontaktuj się: <a href="mailto:integracje@witaline.pl" className="text-brand-500 hover:text-brand-600">integracje@witaline.pl</a>
            </p>
          </div>
        </div>
      )}

      {/* ── Settings ── */}
      {activeSection === "settings" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Ustawienia integracji</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Skonfiguruj wszystkie połączenia z zewnętrznymi usługami w jednym miejscu.
            </p>
          </div>
          <IntegrationsSettings businessId={businessId} />
          <GoogleCalendarSettings businessId={businessId} />
        </div>
      )}
    </div>
  );
}
