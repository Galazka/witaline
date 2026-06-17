"use client";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  inverted?: boolean;
}

const sizes = {
  sm: { icon: 28, text: "text-lg", tag: "text-[10px]", gap: "gap-2" },
  md: { icon: 40, text: "text-2xl", tag: "text-xs", gap: "gap-3" },
  lg: { icon: 56, text: "text-4xl", tag: "text-sm", gap: "gap-4" },
};

export default function Logo({ size = "md", withTagline = true, inverted = false }: LogoProps) {
  const s = sizes[size];
  const textColor = inverted ? "text-white" : "text-black";
  const tagColor = inverted ? "text-brand-400" : "text-brand-500";
  return (
    <div className={`inline-flex items-center ${s.gap}`}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 200 200"
        className="shrink-0"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="95" fill="#72B176" stroke={inverted ? "#fff" : "#000"} strokeWidth="4" />
        <g fill={inverted ? "#fff" : "#000"}>
          <ellipse cx="100" cy="80" rx="28" ry="32" />
          <rect x="92" y="108" width="16" height="12" rx="4" />
          <path d="M60 140 Q60 120 100 120 Q140 120 140 140 L140 175 Q140 180 135 180 L65 180Q60 180 60 175Z" />
          <path
            d="M70 78Q70 50 100 50Q130 50 130 78"
            stroke={inverted ? "#fff" : "#000"}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M65 125Q45 130 40 155L55 155Q60 140 75 135" />
          <path d="M135 125Q155 130 160 155L145 155Q140 140 125 135" />
          <rect x="85" y="95" width="22" height="40" rx="4" />
          <rect x="88" y="100" width="16" height="28" rx="2" fill="#72B176" />
          <ellipse cx="100" cy="92" rx="8" ry="5" />
        </g>
      </svg>

      <div className="leading-none">
        <span
          className={`block font-black tracking-wider ${textColor} font-display ${s.text}`}
          style={{ fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}
        >
          WITALINE
        </span>
        {withTagline && (
          <span
            className={`block font-normal ${tagColor} font-sans ${s.tag}`}
            style={{ letterSpacing: "0.06em" }}
          >
            Tak, słucham
          </span>
        )}
      </div>
    </div>
  );
}




