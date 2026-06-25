"use client";

import { useState, useEffect } from "react";

interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  html: string;
  description: string;
  updated_at: string;
}

export default function AdminEmailConfigurator() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<EmailTemplate> | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/email-templates")
      .then(r => r.json())
      .then(setTemplates)
      .catch(console.error);
  }, []);

  function selectTemplate(t: EmailTemplate) {
    setSelected(t.key);
    setEditing({ ...t });
    setPreview(null);
  }

  async function save() {
    if (!editing?.key) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: editing.key, subject: editing.subject, html: editing.html, description: editing.description }),
      });
      if (!res.ok) throw new Error("Błąd zapisu");
      const updated = await res.json();
      setTemplates(prev => prev.map(t => t.key === updated.key ? updated : t));
      setEditing(updated);
      alert("Zapisano!");
    } catch (e) {
      alert("Nie udało się zapisać: " + (e instanceof Error ? e.message : ""));
    } finally {
      setSaving(false);
    }
  }

  function showPreview() {
    if (!editing?.subject || !editing?.html) return;
    const html = editing.html
      .replaceAll("{{businessName}}", "TestFirma")
      .replaceAll("{{dashboardUrl}}", "https://witaline.pl/dashboard")
      .replaceAll("{{minutesUsed}}", "12")
      .replaceAll("{{maxMinutes}}", "15")
      .replaceAll("{{remaining}}", "3")
      .replaceAll("{{testNumber}}", "+48 732 125 752")
      .replaceAll("{{leadName}}", "Jan Kowalski")
      .replaceAll("{{leadPhone}}", "+48 123 456 789")
      .replaceAll("{{leadInterest}}", "Zainteresowanie")
      .replaceAll("{{daysLeft}}", "2");
    setPreview(`<h1>${editing.subject}</h1>` + html);
  }

  function sendTest() {
    if (!editing?.key) return;
    fetch("/api/admin/email-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: editing.key, subject: editing.subject, html: editing.html }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900">Konfigurator szablonów email</h3>
        <span className="text-xs text-zinc-400">Resend • 3 000 emaili/miesiąc za darmo</span>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-4">
        <div className="space-y-1">
          {templates.map((t) => (
            <button
              key={t.key}
              onClick={() => selectTemplate(t)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${selected === t.key ? "bg-brand-50 text-brand-700 font-medium" : "hover:bg-zinc-50 text-zinc-600"}`}
            >
              <div className="truncate">{t.description || t.key}</div>
              <div className="text-xs text-zinc-400 truncate">{t.subject}</div>
            </button>
          ))}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Key (identyfikator)</label>
              <input value={editing.key || ""} disabled className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-sm text-zinc-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Temat (subject)</label>
              <input
                value={editing.subject || ""}
                onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Treść HTML</label>
              <textarea
                value={editing.html || ""}
                onChange={(e) => setEditing({ ...editing, html: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-mono h-48 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Dostępne zmienne</label>
              <p className="text-xs text-zinc-400">{`{{businessName}}, {{dashboardUrl}}, {{minutesUsed}}, {{maxMinutes}}, {{remaining}}, {{testNumber}}, {{leadName}}, {{leadPhone}}, {{leadInterest}}, {{daysLeft}}`}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="bg-brand-400 text-white px-5 py-2 rounded text-sm font-medium hover:bg-brand-500 disabled:opacity-50">
                {saving ? "Zapisywanie..." : "Zapisz"}
              </button>
              <button onClick={showPreview} className="bg-zinc-100 text-zinc-700 px-5 py-2 rounded text-sm font-medium hover:bg-zinc-200">
                Podgląd
              </button>
              <button onClick={() => { if (confirm("Wysłać testowy email?")) sendTest(); }} className="bg-blue-50 text-blue-600 px-5 py-2 rounded text-sm font-medium hover:bg-blue-100">
                Wyślij test
              </button>
            </div>

            {preview && (
              <div className="border border-zinc-200 rounded-lg p-4 bg-white">
                <h4 className="text-xs font-medium text-zinc-500 mb-2">Podgląd:</h4>
                <div className="border border-zinc-100 rounded overflow-hidden" dangerouslySetInnerHTML={{ __html: preview }} />
              </div>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-zinc-200 rounded-lg p-8 text-center">
            <p className="text-sm text-zinc-400">Wybierz szablon z listy po lewej</p>
          </div>
        )}
      </div>
    </div>
  );
}
