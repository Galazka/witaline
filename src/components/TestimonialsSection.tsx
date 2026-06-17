"use client";

import { useState, useEffect, useRef } from "react";

const testimonials = [
  {
    name: "Katarzyna Wiśniewska",
    role: "Właścicielka",
    company: "Salon Fryzur Katarzyna",
    text: "Bot odbiera telefony gdy pracuję z klientkami. Klientki chwalą, że mogą umówić się przez telefon o dowolnej porze. Rewelacja!",
    rating: 5,
  },
  {
    name: "Michał Adamczyk",
    role: "Lekarz stomatolog",
    company: "Klinika Dentystyczna Adamczyk",
    text: "Pacjenci nie muszą już czekać w kolejce do rejestracji. Bot umawia wizyty, przypomina i odpowiada na podstawowe pytania. Spadek nieodebranych połączeń o 80%.",
    rating: 5,
  },
  {
    name: "Piotr Lewandowski",
    role: "Radca prawny",
    company: "Kancelaria Lewandowski i Wspólnicy",
    text: "Klienci często dzwonią po godzinach. Teraz bot zbiera dane i opis sprawy, a ja oddzwaniam z gotową odpowiedzią. Profesjonalne i oszczędza mój czas.",
    rating: 5,
  },
  {
    name: "Tomasz Zalewski",
    role: "Właściciel",
    company: "AutoSerwis Zalewski",
    text: "Zlecenia na przegląd i diagnostykę spływają nawet w nocy. Bot przyjmuje zgłoszenia lepiej niż człowiek — niczego nie gubi.",
    rating: 4,
  },
  {
    name: "Agnieszka Jankowska",
    role: "Partner zarządzająca",
    company: "Kancelaria Jankowska & Partnerzy",
    text: "Nasi klienci cenią dyskrecję. Bot jest uprzejmy, skuteczny i nie popełnia błędów. Polecam każdej kancelarii, która chce działać nowocześnie.",
    rating: 5,
  },
  {
    name: "Grzegorz Nowak",
    role: "Szef kuchni i współwłaściciel",
    company: "Restauracja Pod Aniołami",
    text: "Rezerwacje stolików, zapytania o menu, zamówienia na wynos — bot ogarnia wszystko. Kelnerzy mają ręce wolne dla gości.",
    rating: 5,
  },
];

function stringToColour(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 55%, 45%)`;
}

function initialCircle(name: string, colour: string) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
      style={{ background: colour }}
    >
      {initials}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-zinc-600"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({
  t,
  index,
}: {
  t: (typeof testimonials)[number];
  index: number;
}) {
  const colour = stringToColour(t.name);

  return (
    <div
      className="bg-brand-950/50 backdrop-blur border border-brand-700/50 rounded-2xl p-6 flex flex-col gap-4 h-full"
      style={{
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div className="flex items-start gap-3">
        {initialCircle(t.name, colour)}
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{t.name}</p>
          <p className="text-zinc-400 text-xs truncate">
            {t.role}, {t.company}
          </p>
        </div>
      </div>
      <p className="text-zinc-300 text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
      <Stars rating={t.rating} />
    </div>
  );
}

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSlides = testimonials.length;

  const next = () => setCurrent((prev) => (prev + 1) % totalSlides);
  const prev = () => setCurrent((prev) => (prev - 1 + totalSlides) % totalSlides);

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(next, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const visible = [testimonials[current]];
  const nextIndex = (current + 1) % totalSlides;
  if (nextIndex !== current) visible.push(testimonials[nextIndex]);

  return (
    <section
      className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand-950 via-brand-950 to-brand-950 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-400/8 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block bg-brand-100 text-brand-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">
            OPINIE
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 font-display tracking-tight">
            Co mówią klienci?
          </h2>
          <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Firmy, które już korzystają z WitaLine i oszczędzają czas
          </p>
        </div>

        <div className="relative">
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 z-10 w-10 h-10 rounded-full bg-brand-950/80 backdrop-blur border border-brand-600/50 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-brand-950/80 transition-colors"
            aria-label="Poprzednia opinia"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 z-10 w-10 h-10 rounded-full bg-brand-950/80 backdrop-blur border border-brand-600/50 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-brand-950/80 transition-colors"
            aria-label="Następna opinia"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="overflow-hidden px-2">
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 transition-all duration-500 ease-in-out"
              key={current}
            >
              <div className="animate-fadeIn">
                <TestimonialCard t={testimonials[current]} index={0} />
              </div>
              <div className="hidden md:block animate-fadeIn" style={{ animationDelay: "0.1s" }}>
                <TestimonialCard t={testimonials[(current + 1) % totalSlides]} index={1} />
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(12px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.5s ease-out both;
            }
          `}</style>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "bg-brand-400 w-6"
                  : "bg-brand-500 hover:bg-brand-500"
              }`}
              aria-label={`Opinia ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
