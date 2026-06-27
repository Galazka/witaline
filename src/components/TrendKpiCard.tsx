"use client";

interface TrendKpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  color?: "brand" | "amber" | "red" | "blue" | "purple";
  format?: "number" | "currency" | "minutes";
}

const COLOR_CONFIG: Record<
  string,
  { bg: string; glow: string; text: string; ring: string }
> = {
  brand: {
    bg: "bg-[#0d9488]/15",
    glow: "rgba(60,191,74,0.35)",
    text: "text-[#0d9488]",
    ring: "ring-[#0d9488]/30",
  },
  amber: {
    bg: "bg-amber-400/15",
    glow: "rgba(245,158,11,0.35)",
    text: "text-amber-400",
    ring: "ring-amber-400/30",
  },
  red: {
    bg: "bg-red-400/15",
    glow: "rgba(239,68,68,0.35)",
    text                    : "text-red-500",
    ring: "ring-red-400/30",
  },
  blue: {
    bg: "bg-blue-400/15",
    glow: "rgba(59,130,246,0.35)",
    text: "text-blue-400",
    ring: "ring-blue-400/30",
  },
  purple: {
    bg: "bg-purple-400/15",
    glow: "rgba(168,85,247,0.35)",
    text: "text-purple-400",
    ring: "ring-purple-400/30",
  },
};

function formatValue(value: string | number, format?: string): string {
  if (format === "currency") {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `${num.toFixed(2).replace(".", ",")} z\u0142`;
  }
  if (format === "minutes") {
    const num = typeof value === "string" ? parseInt(value, 10) : value;
    const h = Math.floor(num / 60);
    const m = num % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }
  return String(value);
}

export default function TrendKpiCard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  color = "brand",
  format,
}: TrendKpiCardProps) {
  const cfg = COLOR_CONFIG[color];
  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;

  return (
    <div
      className="group relative bg-white/55 backdrop-blur-xl border border-white/20 rounded-xl p-4 sm:p-5 transition-all duration-300 hover:border-[#0d9488]/20"
      style={
        {
          "--glow-color": cfg.glow,
        } as React.CSSProperties
      }
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `0 0 24px 2px var(--glow-color), inset 0 0 8px 0 var(--glow-color)` }}
      />
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            {title}
          </span>
          {icon && (
            <span
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${cfg.bg} ${cfg.text} shrink-0`}
            >
              {icon}
            </span>
          )}
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-zinc-900 font-display tracking-tight">
          {formatValue(value, format)}
        </p>
        {trend !== undefined && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-0.5 text-sm font-semibold ${
                trendUp
                  ? "text-green-600"
                  : trendDown
                    ? "text-red-500"
                    : "text-zinc-500"
              }`}
            >
              {trendUp ? "\u2191" : trendDown ? "\u2193" : "\u2192"}{" "}
              {Math.abs(trend)}%
            </span>
            {trendLabel && (
              <span className="text-xs text-zinc-500">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
