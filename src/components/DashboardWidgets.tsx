"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { DashboardConfig, DashboardWidget } from "@/types/database";

interface Props {
  businessId: string;
  onConfigChange?: (config: DashboardConfig) => void;
}

const WIDGET_TYPES = [
  { type: "stats", label: "📈 Statystyki", description: "Wykresy i metryki aktywności" },
  { type: "chats", label: "💬 Historia czatów", description: "Lista rozmów z klientami" },
  { type: "calls", label: "📞 Połączenia", description: "Logi połączeń telefonicznych" },
  { type: "reservations", label: "📅 Rezerwacje", description: "Nadchodzące rezerwacje" },
  { type: "knowledge", label: "🧠 Baza wiedzy", description: "Wpisy wiedzy bota" },
  { type: "transcriptions", label: "📝 Transkrypcje", description: "Transkrypcje rozmów głosowych" },
];

export default function DashboardWidgets({ businessId, onConfigChange }: Props) {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => { fetchConfig(); }, [businessId]);

  async function fetchConfig() {
    setLoading(true);
    const { data } = await supabase
      .from("dashboard_configs")
      .select("*")
      .eq("business_id", businessId)
      .single();

    if (data) {
      setConfig(data as DashboardConfig);
    } else {
      // Create default
      const defaultWidgets: DashboardWidget[] = WIDGET_TYPES.map((w, i) => ({
        id: w.type,
        type: w.type as DashboardWidget["type"],
        enabled: i < 4,
        order: i,
      }));

      const { data: created } = await supabase
        .from("dashboard_configs")
        .insert({
          business_id: businessId,
          layout: { widgets: defaultWidgets },
          theme: "light",
        })
        .select()
        .single();

      if (created) setConfig(created as DashboardConfig);
    }
    setLoading(false);
  }

  async function toggleWidget(widgetType: string) {
    if (!config) return;

    const widgets = config.layout.widgets.map(w =>
      w.type === widgetType ? { ...w, enabled: !w.enabled } : w
    );

    // If widget doesn't exist, add it
    if (!widgets.find(w => w.type === widgetType)) {
      widgets.push({
        id: widgetType,
        type: widgetType as DashboardWidget["type"],
        enabled: true,
        order: widgets.length,
      });
    }

    const newLayout = { ...config.layout, widgets };
    setConfig({ ...config, layout: newLayout });

    setSaving(true);
    await supabase
      .from("dashboard_configs")
      .update({ layout: newLayout })
      .eq("business_id", businessId);
    setSaving(false);

    onConfigChange?.({ ...config, layout: newLayout });
  }

  async function moveWidget(widgetType: string, direction: "up" | "down") {
    if (!config) return;

    const widgets = [...config.layout.widgets];
    const idx = widgets.findIndex(w => w.type === widgetType);
    if (idx === -1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= widgets.length) return;

    // Swap order values
    const tempOrder = widgets[idx].order;
    widgets[idx] = { ...widgets[idx], order: widgets[swapIdx].order };
    widgets[swapIdx] = { ...widgets[swapIdx], order: tempOrder };

    // Sort by order
    widgets.sort((a, b) => a.order - b.order);

    const newLayout = { ...config.layout, widgets };
    setConfig({ ...config, layout: newLayout });

    setSaving(true);
    await supabase
      .from("dashboard_configs")
      .update({ layout: newLayout })
      .eq("business_id", businessId);
    setSaving(false);
  }

  if (loading) {
    return <div className="bg-white rounded-xl border border-zinc-200 p-6 text-center text-sm text-zinc-400">Ładowanie...</div>;
  }

  if (!config) return null;

  const sortedWidgets = [...config.layout.widgets].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h3 className="font-semibold text-zinc-900">Widgety dashboardu</h3>
        <p className="text-xs text-zinc-400 mt-0.5">Wybierz które sekcje chcesz widzieć na głównym panelu</p>
      </div>

      <div className="divide-y divide-zinc-50">
        {sortedWidgets.map((widget) => {
          const meta = WIDGET_TYPES.find(w => w.type === widget.type);
          return (
            <div key={widget.type} className="px-5 py-3 flex items-center gap-4 hover:bg-brand-50 transition">
              {/* Toggle */}
              <button
                onClick={() => toggleWidget(widget.type)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  widget.enabled ? "bg-brand-400" : "bg-brand-100"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  widget.enabled ? "translate-x-5" : ""
                }`} />
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">{meta?.label || widget.type}</p>
                <p className="text-xs text-zinc-400">{meta?.description || ""}</p>
              </div>

              {/* Move buttons */}
              <div className="flex gap-1">
                <button
                  onClick={() => moveWidget(widget.type, "up")}
                  className="p-1.5 rounded-lg bg-brand-50 text-zinc-400 hover:bg-brand-100 hover:text-zinc-600 transition text-xs"
                  title="Przenieś w górę"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveWidget(widget.type, "down")}
                  className="p-1.5 rounded-lg bg-brand-50 text-zinc-400 hover:bg-brand-100 hover:text-zinc-600 transition text-xs"
                  title="Przenieś w dół"
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {saving && (
        <div className="px-5 py-2 bg-brand-50 border-t border-brand-100 text-xs text-brand-600 text-center">
          Zapisywanie...
        </div>
      )}
    </div>
  );
}
