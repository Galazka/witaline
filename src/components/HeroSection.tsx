"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import VoiceAgent from "@/components/VoiceAgent";
import { WITALINE_PHONE_NUMBER, WITALINE_PHONE_DISPLAY } from "@/lib/constants";
import AIChatPreview from "@/components/AIChatPreview";

function ParallaxWrapper({ children, speed = 0.15, className = "" }: { children: React.ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    function onScroll() {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      setOffset((center - viewCenter) * speed);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  return (
    <div ref={ref} className={className} style={{ transform: `translateY(${offset}px)` }}>
      {children}
    </div>
  );
}

interface HeroTr {
  badge: string;
  title1: string;
  title2: string;
  title3: string;
  subtitle: string;
  cta1: string;
  cta2: string;
  trust: string;
  stat1Num: string;
  stat1Label: string;
  stat2Num: string;
  stat2Label: string;
  stat3Num: string;
  stat3Label: string;
  liveTitle: string;
  liveSubtitle: string;
  callTitle: string;
}

interface HeroSectionProps {
  tr: HeroTr;
}

export default function HeroSection({ tr }: HeroSectionProps) {
  return (
    <>
      <section id="wyprobuj" className="relative bg-white text-brand-900 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24 relative w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6 md:space-y-8">
              <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full px-3 py-1 text-xs text-brand-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" style={{ animation: "pulseDot 2s ease-in-out infinite" }} />
                {tr.badge}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] font-display text-brand-900">
                {tr.title1}{" "}
                <span className="bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">{tr.title2}</span>{" "}
                {tr.title3}
              </h1>

              <p className="text-base md:text-lg text-zinc-600 leading-relaxed max-w-xl">
                {tr.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/register"
                  className="bg-brand-500 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-brand-600 transition text-sm shadow-lg shadow-brand-500/25 text-center"
                >
                  {tr.cta1}
                </Link>
                <a
                  href="#wyprobuj"
                  className="border border-brand-200 text-brand-700 px-6 py-3.5 rounded-xl font-semibold hover:bg-brand-50 transition text-sm text-center"
                >
                  {tr.cta2}
                </a>
              </div>

              <p className="text-xs text-brand-400/60 flex items-center gap-1.5 flex-wrap">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {tr.trust}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <a href={`tel:${WITALINE_PHONE_NUMBER}`} className="text-lg font-bold text-zinc-900 tracking-wide font-mono hover:text-brand-500 transition-colors">{WITALINE_PHONE_DISPLAY}</a>
                <span className="text-xs text-zinc-400">· Zadzwoń i sprawdź</span>
              </div>
              <p className="text-[11px] text-zinc-400 -mt-2">Połączenie wg taryfy operatora — bez dodatkowych opłat</p>
            </div>

            <ParallaxWrapper speed={0.15}>
              <AIChatPreview />
            </ParallaxWrapper>
          </div>

          <div className="mt-10 md:mt-14 flex justify-center">
            <div className="inline-flex items-center gap-4 bg-white border border-brand-100 shadow-sm rounded-2xl px-6 py-3">
              <div className="scale-[0.55] origin-center -my-3">
                <VoiceAgent />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-700">Połącz się przez połączenie głosowe</p>
                <p className="text-xs text-zinc-400">Rozmawiaj z Mają przez mikrofon</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
