"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export default function WebhookApiSettings({ businessId }: { businessId: string }) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [slackUrl, setSlackUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase.from("businesses").select("webhook_url, webhook_secret, slack_webhook_url, api_key").eq("id", businessId).single().then(({ data }) => {
      if (data) {
        setWebhookUrl(data.webhook_url || "");
        setWebhookSecret(data.webhook_secret || "");
        setSlackUrl(data.slack_webhook_url || "");
        setApiKey(data.api_key || "");
      }
    });
  }, [businessId]);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from("businesses").update({ webhook_url: webhookUrl || null, webhook_secret: webhookSecret || null, slack_webhook_url: slackUrl || null }).eq("id", businessId);
    setSaving(false);
    setToast(error ? "Błąd: " + error.message : "Zapisano");
    setTimeout(() => setToast(""), 3000);
  }

  async function handleGenerateApiKey() {
    const key = "wl_" + Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(36).padStart(2, "0")).join("").slice(0, 32);
    setApiKey(key);
    await supabase.from("businesses").update({ api_key: key }).eq("id", businessId);
    setToast("Nowy klucz API wygenerowany");
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Webhook (połączenia wychodzące)</h3>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">Po każdej zakończonej rozmowie wyślemy POST z danymi na ten adres.</p>

      <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
        placeholder="https://twoja-firma.pl/webhook/witaline"
        className="w-full px-3 py-2 border border-zinc-200 dark:border-brand-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 font-mono" />

      <input value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)}
        placeholder="Secret do HMAC (opcjonalnie)"
        className="w-full px-3 py-2 border border-zinc-200 dark:border-brand-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 font-mono" />

      <hr className="border-zinc-100 dark:border-brand-800" />

      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Slack</h3>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">Otrzymuj powiadomienia o nowych leadach i rezerwacjach na Slacka.</p>

      <input value={slackUrl} onChange={e => setSlackUrl(e.target.value)}
        placeholder="https://hooks.slack.com/services/..."
        className="w-full px-3 py-2 border border-zinc-200 dark:border-brand-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 font-mono" />

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="bg-[#0d9488] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-50">
          {saving ? "Zapisywanie..." : "Zapisz webhook"}
        </button>
        {toast && <span className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{toast}</span>}
      </div>

      <hr className="border-zinc-100 dark:border-brand-800" />

      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">API Key (REST API v1)</h3>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">Klucz do odczytu danych przez zewnętrzne systemy. Użyj w nagłówku <code className="text-[#0d9488]">Authorization: Bearer &lt;klucz&gt;</code></p>

      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-brand-800 border border-zinc-200 dark:border-brand-700 rounded-lg text-sm font-mono text-zinc-700 dark:text-zinc-300 select-all">
          {apiKey || "—"}
        </code>
        <button onClick={handleGenerateApiKey}
          className="shrink-0 bg-white dark:bg-brand-900 border border-zinc-200 dark:border-brand-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#f0fdfa] transition">
          {apiKey ? "Generuj nowy" : "Generuj klucz"}
        </button>
      </div>

      <details className="text-xs text-zinc-400 dark:text-zinc-500">
        <summary className="cursor-pointer hover:text-zinc-600 dark:text-zinc-400 transition">Przykład użycia</summary>
        <pre className="mt-2 p-3 bg-zinc-50 dark:bg-brand-800 rounded-lg overflow-x-auto text-[11px]">{`curl -H "Authorization: Bearer ${apiKey || "wl_...twój_klucz..."}" \\
  https://witaline.pl/api/v1/calls?limit=10`}</pre>
      </details>
    </div>
  );
}
