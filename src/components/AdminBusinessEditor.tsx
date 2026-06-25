"use client";

import { useState, useEffect } from "react";
import type { Business, BusinessKnowledge } from "@/types/database";

interface Props {
  businessId: string;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = [
  { value: "general", label: "🏷️ Ogólne" },
  { value: "services", label: "🛎️ Usługi" },
  { value: "pricing", label: "💰 Cennik" },
  { value: "hours", label: "🕐 Godziny" },
  { value: "location", label: "📍 Lokalizacja" },
  { value: "faq", label: "❓ FAQ" },
  { value: "products", label: "📦 Produkty" },
  { value: "policies", label: "📋 Zasady" },
  { value: "team", label: "👥 Zespół" },
  { value: "promotions", label: "🎉 Promocje" },
  { value: "custom", label: "✏️ Własne" },
];

export default function AdminBusinessEditor({ businessId, onClose, onSaved }: Props) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [knowledge, setKnowledge] = useState<BusinessKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"prompt" | "knowledge" | "settings">("prompt");

  // Prompt state
  const [systemPrompt, setSystemPrompt] = useState("");
  const [menuCatalog, setMenuCatalog] = useState("{}");

  // Knowledge state
  const [newKnowledge, setNewKnowledge] = useState({ title: "", content: "", category: "general" });
  const [editingKnowledge, setEditingKnowledge] = useState<string | null>(null);

  // Settings state
  const [bizName, setBizName] = useState("");
  const [plan, setPlan] = useState("");
  const [suspended, setSuspended] = useState(false);
  const [industry, setIndustry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [smsLimit, setSmsLimit] = useState(0);
  const [smsExtra, setSmsExtra] = useState(0);
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [creatingSubaccount, setCreatingSubaccount] = useState(false);
  const [twilioMsg, setTwilioMsg] = useState("");

  useEffect(() => { fetchData(); }, [businessId]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/businesses?id=${businessId}`);
      if (!res.ok) throw new Error("Failed to fetch business");
      const data = await res.json();

      if (data.business) {
        const biz = data.business as Business;
        setBusiness(biz);
        setSystemPrompt(biz.system_prompt || "");
        setMenuCatalog(JSON.stringify(biz.menu_catalog || {}, null, 2));
        setPlan(biz.current_plan);
        setSuspended(biz.suspended);
        setIndustry(biz.industry || "");
        setWebsiteUrl(biz.website_url || "");
        setPhone(biz.phone || "");
        setBizName(biz.name || "");
        setSmsLimit(biz.sms_limit || 0);
        setSmsExtra(biz.sms_extra_purchased || 0);
        setTwilioAccountSid(biz.twilio_account_sid || "");
        setTwilioAuthToken(biz.twilio_auth_token || "");
      }

      if (data.knowledge) setKnowledge(data.knowledge as BusinessKnowledge[]);
    } catch (e) {
      console.error("[AdminBusinessEditor] fetch error:", e);
    }
    setLoading(false);
  }

  async function handleSavePrompt() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/businesses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: businessId,
        system_prompt: systemPrompt,
        menu_catalog: JSON.parse(menuCatalog || "{}"),
      }),
    });
    if (res.ok) {
      setMessage("✅ Zapisano prompt i konfigurację");
      onSaved();
    } else {
      setMessage("❌ Błąd zapisu");
    }
    setSaving(false);
  }

  async function handleAddKnowledge() {
    if (!newKnowledge.title || !newKnowledge.content) return;
    setSaving(true);
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, ...newKnowledge }),
    });
    if (res.ok) {
      setNewKnowledge({ title: "", content: "", category: "general" });
      fetchData();
    }
    setSaving(false);
  }

  async function handleDeleteKnowledge(id: string) {
    await fetch(`/api/knowledge?id=${id}&businessId=${businessId}`, {
      method: "DELETE",
    });
    fetchData();
  }

  async function handleSaveSettings() {
    setSaving(true);
    const res = await fetch("/api/admin/businesses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: businessId, name: bizName, current_plan: plan, suspended, industry, website_url: websiteUrl, phone }),
    });

    // Save SMS limits separately
    await fetch("/api/admin/sms/limits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: businessId, sms_limit: smsLimit, sms_extra_purchased: smsExtra }),
    });
    if (res.ok) {
      setMessage("✅ Zapisano ustawienia");
      onSaved();
    }
    setSaving(false);
  }

  if (loading) return <div className="p-6 text-center text-zinc-400">Ładowanie...</div>;
  if (!business) return <div className="p-6 text-center text-red-500">Nie znaleziono firmy</div>;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">{business.name}</h2>
            <p className="text-xs text-zinc-400">ID: {business.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-brand-50 rounded-lg transition">✕</button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex gap-1 border-b border-zinc-200">
          {[
            { key: "prompt", label: "📝 Prompt bota" },
            { key: "knowledge", label: "🧠 Baza wiedzy" },
            { key: "settings", label: "⚙️ Ustawienia" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                activeTab === t.key ? "bg-brand-50 text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Prompt tab */}
          {activeTab === "prompt" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                  placeholder="Instrukcja dla asystenta AI..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Menu / Katalog (JSON)</label>
                <textarea
                  value={menuCatalog}
                  onChange={(e) => setMenuCatalog(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                  placeholder='{"menu": [...], "hours": "..."}'
                />
              </div>
            </div>
          )}

          {/* Knowledge tab */}
          {activeTab === "knowledge" && (
            <div className="space-y-4">
              {/* Add new */}
              <div className="bg-white rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-medium text-zinc-900">Dodaj wpis</h4>
                <div className="flex gap-3">
                  <select
                    value={newKnowledge.category}
                    onChange={(e) => setNewKnowledge({ ...newKnowledge, category: e.target.value })}
                    className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input
                    value={newKnowledge.title}
                    onChange={(e) => setNewKnowledge({ ...newKnowledge, title: e.target.value })}
                    placeholder="Tytuł"
                    className="flex-1 px-4 py-2 border border-zinc-200 rounded-lg text-sm"
                  />
                </div>
                <textarea
                  value={newKnowledge.content}
                  onChange={(e) => setNewKnowledge({ ...newKnowledge, content: e.target.value })}
                  placeholder="Treść wiedzy dla bota..."
                  rows={3}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm"
                />
                <button
                  onClick={handleAddKnowledge}
                  disabled={!newKnowledge.title || !newKnowledge.content || saving}
                  className="px-4 py-2 bg-brand-400 text-white text-sm font-medium rounded-lg hover:bg-brand-500 transition disabled:opacity-50"
                >
                  {saving ? "Dodawanie..." : "Dodaj wpis"}
                </button>
              </div>

              {/* Existing entries */}
              <div className="space-y-2">
                {knowledge.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-4">Brak wpisów w bazie wiedzy</p>
                ) : (
                  knowledge.map(entry => (
                    <div key={entry.id} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-start gap-3">
                      <span className="text-xs px-2 py-1 bg-brand-50 text-zinc-600 rounded-full shrink-0">
                        {CATEGORIES.find(c => c.value === entry.category)?.label || entry.category}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900">{entry.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{entry.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteKnowledge(entry.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Settings tab */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Nazwa firmy</label>
                <input
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="Nazwa firmy"
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Plan</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm"
                >
                  <option value="elastic_0">Elastyczny — 0 zł/mies, pay-as-you-go</option>
                  <option value="enterprise_2000">Enterprise — indywidualna wycena</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Branża</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm"
                >
                  <option value="">— Wybierz —</option>
                  <option value="restauracja">Restauracja</option>
                  <option value="medycyna">Medycyna</option>
                  <option value="prawnik">Kancelaria Prawna</option>
                  <option value="mechanik">Warsztat / Mechanik</option>
                  <option value="fryzjer">Salon Fryzjerski</option>
                  <option value="dentysta">Gabinet Stomatologiczny</option>
                  <option value="hotel">Hotel</option>
                  <option value="taksowka">Taxi / Transport</option>
                  <option value="kurier">Kurier / Paczki</option>
                  <option value="szkola">Edukacja / Szkoła</option>
                  <option value="sport">Sport / Fitness</option>
                  <option value="kosmetyka">Kosmetyka / SPA</option>
                  <option value="weterynarz">Weterynarz</option>
                  <option value="remont">Remont / Budowa</option>
                  <option value="it">IT / Serwis</option>
                  <option value="ksiegowosc">Księgowość</option>
                  <option value="custom">Inna branża</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Strona WWW</label>
                <input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Telefon przekierowania do konsultanta</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+48 123 456 789"
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Limit SMS (plan)</label>
                  <input
                    type="number"
                    min={0}
                    value={smsLimit}
                    onChange={(e) => setSmsLimit(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Dodatkowe SMS (zakupione)</label>
                  <input
                    type="number"
                    min={0}
                    value={smsExtra}
                    onChange={(e) => setSmsExtra(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="border-t border-zinc-200 pt-6 mt-6">
                <h4 className="text-sm font-bold text-zinc-900 mb-3">🔐 Twilio Subkonto</h4>
                {twilioAccountSid ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-medium text-green-800">✓ Subkonto aktywne</p>
                    <p className="text-xs text-green-700 font-mono break-all">SID: {twilioAccountSid}</p>
                  </div>
                ) : (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm text-zinc-600">Brak subkonta Twilio. Możesz utworzyć nowe lub wprowadzić ręcznie.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">Account SID</label>
                        <input
                          value={twilioAccountSid}
                          onChange={(e) => setTwilioAccountSid(e.target.value)}
                          placeholder="AC..."
                          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">Auth Token</label>
                        <input
                          value={twilioAuthToken}
                          onChange={(e) => setTwilioAuthToken(e.target.value)}
                          placeholder="sk/ auth token..."
                          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!twilioAccountSid || !twilioAuthToken) return;
                        setSaving(true);
                        const res = await fetch("/api/admin/businesses", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: businessId, twilio_account_sid: twilioAccountSid, twilio_auth_token: twilioAuthToken }),
                        });
                        setTwilioMsg(res.ok ? "✅ Zapisano subkonto" : "❌ Błąd zapisu");
                        setSaving(false);
                      }}
                      disabled={!twilioAccountSid || !twilioAuthToken || saving}
                      className="px-3 py-1.5 bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg hover:bg-zinc-300 transition disabled:opacity-50"
                    >
                      Zapisz subkonto
                    </button>
                    <span className="text-xs text-zinc-400 mx-2">lub</span>
                    <button
                      onClick={async () => {
                        setCreatingSubaccount(true);
                        setTwilioMsg("");
                        try {
                          const res = await fetch(`/api/admin/business/${businessId}/create-subaccount`, { method: "POST" });
                          const data = await res.json();
                          if (res.ok) {
                            setTwilioAccountSid(data.account_sid);
                            setTwilioMsg("✅ Subkonto utworzone");
                          } else {
                            setTwilioMsg(`❌ ${data.error || "Błąd"}`);
                          }
                        } catch {
                          setTwilioMsg("❌ Błąd sieci");
                        }
                        setCreatingSubaccount(false);
                      }}
                      disabled={creatingSubaccount}
                      className="px-4 py-1.5 bg-brand-400 text-white text-xs font-medium rounded-lg hover:bg-brand-500 transition disabled:opacity-50"
                    >
                      {creatingSubaccount ? "Tworzenie..." : "⚡ Utwórz subkonto automatycznie"}
                    </button>
                    {twilioMsg && <p className="text-xs text-zinc-500">{twilioMsg}</p>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-zinc-700">Status:</label>
                <button
                  onClick={() => setSuspended(!suspended)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    suspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}
                >
                  {suspended ? "🔒 Zawieszona" : "✓ Aktywna"}
                </button>
              </div>
              <div className="bg-white rounded-xl p-4 text-xs text-zinc-500 space-y-1">
                <p>📞 Numer: {business.twilio_number || "Brak"}</p>
                <p>💰 Użyte minuty: {business.minutes_used_this_week}</p>
                <p>📅 Subskrypcja: {business.subscription_status}</p>
                <p>🏢 Branża: {business.industry || "Nie wybrano"}</p>
                <p>🌐 Strona WWW: {business.website_url || "—"}</p>
                <p>📱 Telefon przekierowania do konsultanta: {business.phone || "—"}</p>
                <p>📧 Email właściciela: {business.owner_uid || "—"}</p>
                <p>🆔 Stripe subskrypcja: {business.stripe_subscription_id || "—"}</p>
                <p>📅 Utworzono: {business.created_at ? new Date(business.created_at).toLocaleDateString("pl-PL") : "—"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-between">
          <p className="text-sm text-zinc-500">{message}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-zinc-600 text-sm rounded-lg hover:bg-brand-50 transition">
              Zamknij
            </button>
            <button
              onClick={activeTab === "settings" ? handleSaveSettings : handleSavePrompt}
              disabled={saving}
              className="px-6 py-2 bg-brand-400 text-white text-sm font-medium rounded-lg hover:bg-brand-500 transition disabled:opacity-50"
            >
              {saving ? "Zapisywanie..." : "Zapisz"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
