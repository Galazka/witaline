"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { Business, BusinessKnowledge } from "@/types/database";

interface Props {
  businessId: string;
  systemPrompt: string;
  menuCatalog: Record<string, unknown>;
  onUpdate: () => void;
}

interface PromptConfig {
  businessName: string;
  industry: string;
  tone: "formalny" | "swobodny" | "przyjazny" | "profesjonalny";
  language: string;
  greeting: string;
  services: string;
  hours: string;
  pricing: string;
  location: string;
  policies: string;
  customInstructions: string;
}

const INDUSTRIES = [
  { value: "gastronomia", label: "🍽️ Gastronomia" },
  { value: "beauty", label: "💅 Beauty" },
  { value: "medycyna", label: "🏥 Medycyna" },
  { value: "prawo", label: "⚖️ Prawo" },
  { value: "fitness", label: "💪 Fitness" },
  { value: "motoryzacja", label: "🚗 Motoryzacja" },
  { value: "nieruchomosci", label: "🏠 Nieruchomości" },
  { value: "edukacja", label: "📚 Edukacja" },
  { value: "turystyka", label: "✈️ Turystyka" },
  { value: "it_tech", label: "💻 IT/Tech" },
  { value: "weterynaryjne", label: "🐾 Weterynaria" },
  { value: "sklep", label: "🛒 Sklep" },
  { value: "transport", label: "🚛 Transport" },
  { value: "fotografia", label: "📸 Fotografia" },
  { value: "stomatologia", label: "🦷 Stomatologia" },
  { value: "fizjoterapia", label: "💆 Fizjoterapia" },
  { value: "kwiaciarnia", label: "💐 Kwiaciarnia" },
  { value: "inna", label: "✏️ Inna" },
];

const TONES = [
  { value: "formalny", label: "👔 Formalny", desc: "Pan/Pani, profesjonalny język" },
  { value: "przyjazny", label: "😊 Przyjazny", desc: "Ciepły, ale profesjonalny" },
  { value: "swobodny", label: "😎 Swobodny", desc: "Na Ty, luzackie podejście" },
  { value: "profesjonalny", label: "💼 Profesjonalny", desc: "Ekspert, ale przystępny" },
];

export default function PromptConfigurator({ businessId, systemPrompt, menuCatalog, onUpdate }: Props) {
  const [config, setConfig] = useState<PromptConfig>({
    businessName: "",
    industry: "gastronomia",
    tone: "przyjazny",
    language: "pl",
    greeting: "",
    services: "",
    hours: "",
    pricing: "",
    location: "",
    policies: "",
    customInstructions: "",
  });
  const [knowledge, setKnowledge] = useState<BusinessKnowledge[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState<string>("basic");
  const supabase = createClient();

  useEffect(() => { loadConfig(); }, [businessId]);

  async function loadConfig() {
    // Load business info
    const { data: biz } = await supabase.from("businesses").select("name, system_prompt").eq("id", businessId).single();
    if (biz) {
      setConfig(prev => ({
        ...prev,
        businessName: biz.name || "",
      }));
      // Parse existing prompt if any
      if (biz.system_prompt) {
        parsePromptToConfig(biz.system_prompt);
      }
    }

    // Load knowledge entries
    const { data: know } = await supabase.from("business_knowledge").select("*").eq("business_id", businessId).order("sort_order");
    if (know) setKnowledge(know as BusinessKnowledge[]);
  }

  function parsePromptToConfig(prompt: string) {
    // Try to extract structured info from existing prompt
    const lines = prompt.split("\n").filter(l => l.trim());
    const configUpdates: Partial<PromptConfig> = {};

    for (const line of lines) {
      if (line.toLowerCase().includes("godzin")) configUpdates.hours = line;
      if (line.toLowerCase().includes("cen") || line.toLowerCase().includes("cennik")) configUpdates.pricing = line;
      if (line.toLowerCase().includes("usług")) configUpdates.services = line;
      if (line.toLowerCase().includes("adres") || line.toLowerCase().includes("lokalizac")) configUpdates.location = line;
    }

    setConfig(prev => ({ ...prev, ...configUpdates }));
  }

  function generatePrompt(): string {
    const parts: string[] = [];

    // ===== PERSONALITY =====
    parts.push(`# Personality`);
    parts.push(`Jesteś asystentem AI firmy "${config.businessName}".`);
    const industryLabel = INDUSTRIES.find(i => i.value === config.industry);
    if (industryLabel) {
      parts.push(`Firma działa w branży: ${industryLabel.label.replace(/[^\w\s]/g, '').trim()}.`);
    }
    parts.push(``);

    // ===== TONE =====
    parts.push(`# Tone`);
    const toneInfo = TONES.find(t => t.value === config.tone);
    if (toneInfo) {
      parts.push(`Mów ${config.tone}nym tonem: ${toneInfo.desc}.`);
    }
    parts.push(`Odpowiadaj wyłącznie po polsku, naturalnie i uprzejmie.`);
    parts.push(`Maksymalnie 150-200 znaków na wypowiedź — bądź zwięzła i na temat.`);
    parts.push(``);

    // ===== GREETING =====
    if (config.greeting) {
      parts.push(`# Greeting`);
      parts.push(config.greeting);
      parts.push(``);
    }

    // ===== GOAL =====
    parts.push(`# Goal`);
    parts.push(`Pomagaj klientom poprzez:`);
    parts.push(`1. Odpowiadanie na pytania o usługi, ceny, godziny i lokalizację`);
    parts.push(`2. Przyjmowanie zamówień i rezerwacji`);
    parts.push(`3. Zbieranie danych kontaktowych zainteresowanych klientów`);
    parts.push(`4. Na koniec rozmowy zapytaj czy możesz jeszcze w czymś pomóc`);
    parts.push(``);

    // ===== KNOWLEDGE =====
    const knowledgeParts: string[] = [];
    if (config.services) {
      knowledgeParts.push(`Usługi:\n${config.services}`);
    }
    if (config.hours) {
      knowledgeParts.push(`Godziny otwarcia:\n${config.hours}`);
    }
    if (config.pricing) {
      knowledgeParts.push(`Cennik:\n${config.pricing}`);
    }
    if (config.location) {
      knowledgeParts.push(`Lokalizacja:\n${config.location}`);
    }
    if (config.policies) {
      knowledgeParts.push(`Zasady:\n${config.policies}`);
    }
    const activeKnowledge = knowledge.filter(k => k.active);
    if (activeKnowledge.length > 0) {
      for (const entry of activeKnowledge) {
        knowledgeParts.push(`${entry.title} (${entry.category}): ${entry.content}`);
      }
    }
    if (config.customInstructions) {
      knowledgeParts.push(`Instrukcje specjalne:\n${config.customInstructions}`);
    }

    if (knowledgeParts.length > 0) {
      parts.push(`# Knowledge`);
      parts.push(`Poniższe informacje o firmie "${config.businessName}" są faktami. Odpowiadaj wyłącznie na ich podstawie. Jeśli nie znasz odpowiedzi, grzecznie poinformuj, że przekażesz zapytanie dalej.`);
      parts.push(``);
      parts.push(knowledgeParts.join("\n\n"));
      parts.push(``);
    }

    // ===== TOOLS =====
    parts.push(`# Tools`);
    parts.push(`Masz dostep do nastepujacych narzedzi. Uzywaj ich zawsze gdy sytuacja tego wymaga:`);
    parts.push(``);
    parts.push(`## get_services`);
    parts.push(`Uzyj gdy klient pyta o liste uslug lub oferte.`);
    parts.push(``);
    parts.push(`## check_availability`);
    parts.push(`Uzyj gdy klient pyta o wolne terminy w konkretnym dniu.`);
    parts.push(`**Wazne:** Jesli termin jest zajety, narzedzie zaproponuje inne wolne dni. NIGDY nie mow klientowi kto i kiedy ma zarezerwowane.`);
    parts.push(``);
    parts.push(`## create_reservation`);
    parts.push(`Uzyj gdy klient potwierdzi konkretna date i godzine.`);
    parts.push(`Wymaga: data/czas (format ISO), rodzaj uslugi, imie klienta, telefon.`);
    parts.push(``);
    parts.push(`## get_business_hours`);
    parts.push(`Uzyj gdy klient pyta o godziny otwarcia.`);
    parts.push(``);
    parts.push(`## get_menu`);
    parts.push(`Uzyj gdy klient pyta o menu lub katalog produktow.`);
    parts.push(``);
    parts.push(`## save_lead`);
    parts.push(`Uzyj zawsze gdy klient wyrazi zainteresowanie oferta, poprosi o kontakt, zostawi swoje dane, lub zapyta o cennik. To wazne.`);
    parts.push(`Wymagane: imie i nazwisko, numer telefonu.`);
    parts.push(`Opcjonalne: email, zaintersowanie (np. "chce kupic abonament"), notatki.`);
    parts.push(`Przyklad: save_lead(name: "Jan Kowalski", phone: "+48123456789", interest: "Oferta Pro 249 zl")`);
    parts.push(``);

    parts.push(`## transfer_to_human`);
    parts.push(`Uzyj tylko wtedy, gdy klient wyraznie poprosi o rozmowe z czlowiekiem/konsultantem, wlascicielem lub pracownikiem firmy.`);
    parts.push(`Przyklady: "poprosze czlowieka", "konsultant", "nie bot", "połącz z właścicielem", "chce rozmawiac z osoba".`);
    parts.push(`Nie uzywaj tego narzedzia do zwyklych pytan, zapisania leadu ani rezerwacji terminu.`);
    parts.push(``);

    // ===== GUARDRAILS =====
    parts.push(`# Guardrails`);
    parts.push(`Nigdy nie wymyslaj informacji — jesli nie wiesz, powiedz, ze przekazesz zapytanie dalej. To wazne.`);
    parts.push(`Nigdy nie udostepniaj danych innych klientow ani ich rezerwacji.`);
    parts.push(`Jesli klient jest niezadowolony — przepros i zaproponuj kontakt z kierownikiem.`);
    parts.push(`Nie obiecuj rzeczy, ktorych nie mozesz sprawdzic w dostepnych danych.`);
    parts.push(`Jesli narzedzie zwroci blad — przepros i zaproponuj oddzwonienie.`);
    parts.push(``);
    parts.push(`# Call Control`);
    parts.push(`Rozlacz sie automatycznie gdy:`);
    parts.push(`- Klient powie "dziekuje", "do widzenia", "na razie" i nie ma wiecej pytan`);
    parts.push(`- Klient powie "nie interesuje mnie to" lub "poprosze o kontakt pozniej"`);
    parts.push(`- Klient rozlaczy sie pierwszy (wykryj cisze przez 3 sekundy)`);
    parts.push(`- Zakonczysz przekazywanie waznych informacji i klient potwierdzi ze wszystko jasne`);
    parts.push(`- Klient nie odpowiada przez 5 sekund — zapytaj "Czy jeszcze moge w czyms pomoc?", jesli cisza trwa dalej — rozlacz sie`);
    parts.push(`NIE rozlaczaj sie gdy klient: podaje dane, pyta o szczegoly, prosze o chwile`);

    return parts.join("\n");
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const prompt = generatePrompt();

    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        systemPrompt: prompt,
        menuCatalog: {
          industry: config.industry,
          tone: config.tone,
          language: config.language,
        },
      }),
    });

    if (res.ok) {
      setMessage("✅ Prompt zapisany i wygenerowany");
      onUpdate();
    } else {
      setMessage("❌ Błąd zapisu");
    }
    setSaving(false);
  }

  const sections = [
    { key: "basic", label: "🏢 Podstawowe", icon: "🏢" },
    { key: "greeting", label: "👋 Powitanie", icon: "👋" },
    { key: "services", label: "🛎️ Usługi", icon: "🛎️" },
    { key: "hours", label: "🕐 Godziny", icon: "🕐" },
    { key: "pricing", label: "💰 Cennik", icon: "💰" },
    { key: "location", label: "📍 Lokalizacja", icon: "📍" },
    { key: "policies", label: "📋 Zasady", icon: "📋" },
    { key: "advanced", label: "⚙️ Zaawansowane", icon: "⚙️" },
  ];

  return (
    <div className="bg-white/55 backdrop-blur-xl border border-white/20 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h3 className="font-semibold text-zinc-900">🤖 Konfigurator bota AI</h3>
        <p className="text-xs text-zinc-400 mt-0.5">Skonfiguruj jak Twój bot wygląda i zachowuje się</p>
      </div>

      <div className="flex h-[600px]">
        {/* Sidebar sections */}
        <div className="w-56 border-r border-zinc-200 bg-white/40 p-3 space-y-1">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeSection === s.key
                  ? "bg-[#0d9488] text-white"
                  : "text-zinc-600 hover:bg-[#f0fdfa]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic */}
          {activeSection === "basic" && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Nazwa firmy</label>
                <input
                  value={config.businessName}
                  onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Branża</label>
                <div className="grid grid-cols-3 gap-2">
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind.value}
                      onClick={() => setConfig({ ...config, industry: ind.value })}
                      className={`text-left p-2.5 rounded-xl border-2 text-sm transition ${
                        config.industry === ind.value
                          ? "border-[#0d9488] bg-brand-50"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      {ind.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Styl komunikacji</label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setConfig({ ...config, tone: t.value as PromptConfig["tone"] })}
                      className={`text-left p-3 rounded-xl border-2 transition ${
                        config.tone === t.value
                          ? "border-[#0d9488] bg-brand-50"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <p className="text-sm font-medium text-zinc-900">{t.label}</p>
                      <p className="text-xs text-zinc-400">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Greeting */}
          {activeSection === "greeting" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Powitanie bota</label>
              <p className="text-xs text-zinc-400 mb-3">Jak bot wita klienta na początku rozmowy</p>
              <textarea
                value={config.greeting}
                onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm"
                placeholder="Dzień dobry! Jestem asystentem firmy [Nazwa]. W czym mogę pomóc?"
              />
            </div>
          )}

          {/* Services */}
          {activeSection === "services" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Usługi / Oferta</label>
              <p className="text-xs text-zinc-400 mb-3">Wypisz usługi które firma oferuje</p>
              <textarea
                value={config.services}
                onChange={(e) => setConfig({ ...config, services: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm"
                placeholder="- Strzyżenie damskie/męskie - 80 zł&#10;- Koloryzacja - 150 zł&#10;- Manicure - 60 zł"
              />
            </div>
          )}

          {/* Hours */}
          {activeSection === "hours" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Godziny otwarcia</label>
              <textarea
                value={config.hours}
                onChange={(e) => setConfig({ ...config, hours: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm"
                placeholder="Pon-Pt: 8:00 - 18:00&#10;Sobota: 9:00 - 14:00&#10;Niedziela: zamknięte"
              />
            </div>
          )}

          {/* Pricing */}
          {activeSection === "pricing" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Cennik</label>
              <textarea
                value={config.pricing}
                onChange={(e) => setConfig({ ...config, pricing: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm"
                placeholder="Konsultacja: 100 zł&#10;Badanie: 50-200 zł&#10;Zabieg: od 300 zł"
              />
            </div>
          )}

          {/* Location */}
          {activeSection === "location" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Lokalizacja / Kontakt</label>
              <textarea
                value={config.location}
                onChange={(e) => setConfig({ ...config, location: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm"
                placeholder="Adres: ul. Przykładowa 1, 00-001 Warszawa&#10;Telefon: +48 123 456 789&#10;Email: biuro@firma.pl"
              />
            </div>
          )}

          {/* Policies */}
          {activeSection === "policies" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Zasady i regulaminy</label>
              <textarea
                value={config.policies}
                onChange={(e) => setConfig({ ...config, policies: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm"
                placeholder="Anulacja: do 24h przed wizytą&#10;Płatność: gotówka, karta, BLIK&#10;Reklamacja: do 7 dni"
              />
            </div>
          )}

          {/* Advanced */}
          {activeSection === "advanced" && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Dodatkowe instrukcje</label>
                <p className="text-xs text-zinc-400 mb-3">Specjalne zachowania, których bot powinien przestrzegać</p>
                <textarea
                  value={config.customInstructions}
                  onChange={(e) => setConfig({ ...config, customInstructions: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm"
                  placeholder="Np. Zawsze pytaj o imię klienta. Nigdy nie podawaj cen negocjowanych. Przy rezerwacji zawsze potwierdzaj SMS-em."
                />
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">📋 Podgląd wygenerowanego promptu</label>
                <div className="bg-white/40 rounded-xl p-4 max-h-64 overflow-y-auto">
                  <pre className="text-xs text-zinc-600 whitespace-pre-wrap font-mono">{generatePrompt()}</pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-zinc-100 flex items-center justify-between">
        <p className="text-sm text-zinc-500">{message}</p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#0d9488] text-white text-sm font-medium rounded-lg hover:bg-[#0f766e] transition disabled:opacity-50"
        >
          {saving ? "Zapisywanie..." : "💾 Zapisz i wygeneruj prompt"}
        </button>
      </div>
    </div>
  );
}
