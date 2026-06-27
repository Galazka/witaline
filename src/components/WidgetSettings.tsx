"use client";

import { useState } from "react";

interface Props {
  businessId: string;
}

export default function WidgetSettings({ businessId }: Props) {
  const [activeTab, setActiveTab] = useState<"script" | "iframe" | "link">("script");
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://witaline.pl";
  const widgetUrl = `${origin}/widget?business=${businessId}`;
  const directLink = widgetUrl;

  const scriptCode = `<!-- WitaLine AI Chat Widget -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${origin}/widget.js';
    s.dataset.businessId = '${businessId}';
    s.dataset.position = 'bottom-right';
    s.dataset.theme = 'light';
    document.body.appendChild(s);
  })();
</script>`;

  const iframeCode = `<!-- WitaLine AI Chat Widget (iframe) -->
<iframe
  src="${widgetUrl}"
  style="position:fixed;bottom:0;right:0;width:380px;height:580px;border:none;z-index:9999;box-shadow:0 4px 24px rgba(0,0,0,0.15);border-radius:16px 0 0 0;"
  allow="microphone; autoplay"
></iframe>`;

  const codes: Record<string, string> = {
    script: scriptCode,
    iframe: iframeCode,
    link: directLink,
  };

  function handleCopy() {
    navigator.clipboard.writeText(codes[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">Widget na Twoją stronę</h3>
        <p className="text-sm text-zinc-500">
          Dodaj czat AI na swoją stronę www. Klienci mogą pisać do asystenta direct z przeglądarki.
        </p>
      </div>

      {/* Preview bubble */}
      <div className="bg-white rounded-2xl p-6">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Podgląd</p>
        <div className="relative bg-white rounded-xl border border-zinc-200 h-48 overflow-hidden">
          <div className="absolute bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-[#0d9488] to-[#0f766e] rounded-full flex items-center justify-center shadow-lg shadow-[#0d9488]/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="absolute bottom-20 right-4 w-64 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#0d9488] to-[#0f766e] px-4 py-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Asystent AI</p>
                <p className="text-[10px] text-white/70">online</p>
              </div>
            </div>
            <div className="p-3">
              <div className="bg-brand-50 rounded-xl rounded-bl-md px-3 py-2 text-[11px] text-zinc-700">
                Dzień dobry! W czym mogę pomóc?
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embed tabs */}
      <div className="flex gap-1 bg-brand-50 p-1 rounded-xl">
        {([
          ["script", "Script (zalecane)"],
          ["iframe", "Iframe"],
          ["link", "Link bezpośredni"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setCopied(false); }}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Code display */}
      <div className="space-y-3">
        {activeTab === "script" && (
          <div className="bg-brand-50 rounded-xl p-3 flex items-start gap-2">
            <span className="text-sm mt-0.5">✨</span>
            <p className="text-xs text-brand-700">
              <strong>Script</strong> — dodaje pływający przycisk w rogu strony. Klient klika i otwiera się czat. Najlepsza opcja.
            </p>
          </div>
        )}
        {activeTab === "iframe" && (
          <div className="bg-white rounded-xl p-3 flex items-start gap-2">
            <span className="text-sm mt-0.5">📌</span>
            <p className="text-xs text-zinc-600">
              <strong>Iframe</strong> — wbudowuje czat direct na stronę. Zajmuje miejsce w layoucie.
            </p>
          </div>
        )}
        {activeTab === "link" && (
          <div className="bg-white rounded-xl p-3 flex items-start gap-2">
            <span className="text-sm mt-0.5">🔗</span>
            <p className="text-xs text-zinc-600">
              <strong>Link</strong> — udostępnij jako osobną stronę. Idealny do social media lub email.
            </p>
          </div>
        )}

        <div className="bg-brand-950 rounded-xl p-4 relative group">
          <pre className="text-xs text-zinc-100 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
            {codes[activeTab]}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 px-3 py-1.5 text-[10px] font-medium text-zinc-400 bg-brand-950 rounded-lg hover:bg-brand-950 hover:text-white transition opacity-0 group-hover:opacity-100"
          >
            {copied ? "✓ Skopiowano" : "Kopiuj"}
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#0d9488] rounded-xl hover:bg-[#0f766e] transition"
        >
          {copied ? "✓ Skopiowano!" : "Kopiuj kod"}
        </button>
      </div>

      {/* How it works */}
      <div className="border-t border-zinc-200 pt-6">
        <h4 className="text-sm font-semibold text-zinc-900 mb-3">Jak to działa?</h4>
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: "1", title: "Wklej kod", desc: "Dodaj script przed </body>" },
            { step: "2", title: "Pojawi się bubble", desc: "Przycisk w rogu strony" },
            { step: "3", title: "Klient pisze", desc: "Czat z AI bez dzwonienia" },
          ].map(item => (
            <div key={item.step} className="text-center">
              <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-[#0d9488]">{item.step}</span>
              </div>
              <p className="text-xs font-medium text-zinc-900">{item.title}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
