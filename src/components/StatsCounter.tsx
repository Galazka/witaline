"use client";

import { useState, useEffect, useRef } from "react";

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export default function StatsCounter({
  end,
  suffix = "",
  prefix = "",
  duration = 2000,
  className = "",
}: {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          setVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuad(progress);
      setCount(Math.round(eased * end));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, end, duration]);

  return (
    <span ref={ref} className={`font-bold text-[#0d9488] font-display ${className}`}>
      {prefix}{count}{suffix}
    </span>
  );
}
