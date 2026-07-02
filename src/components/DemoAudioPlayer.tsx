"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const AUDIO_URL = "/audio/conv.mp3";
const DURATION = 117.68;
const BAR_COUNT = 36;

function PlayIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function DemoAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    setBarHeights(Array.from({ length: BAR_COUNT }, () => Math.random() * 0.2 + 0.1));
  }, []);

  const generateBars = useCallback(() => {
    setBarHeights(Array.from({ length: BAR_COUNT }, () => {
      if (!isPlaying) return Math.random() * 0.2 + 0.1;
      return Math.random() * 0.4 + 0.15 + Math.random() * 0.45;
    }));
    if (isPlaying) {
      animRef.current = requestAnimationFrame(generateBars);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animRef.current = requestAnimationFrame(generateBars);
    } else {
      cancelAnimationFrame(animRef.current);
      setBarHeights(Array.from({ length: BAR_COUNT }, () => Math.random() * 0.2 + 0.1));
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, generateBars]);

  useEffect(() => {
    const audio = new Audio(AUDIO_URL);
    audio.preload = "metadata";
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (audio.ended || currentTime >= DURATION) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }
      audio.play().catch((e) => console.warn("[DemoAudioPlayer] play error:", e));
      setIsPlaying(true);
    }
  }, [isPlaying, currentTime]);

  const progress = DURATION > 0 ? (currentTime / DURATION) * 100 : 0;

  return (
    <div className="group bg-white/55 backdrop-blur-xl border border-zinc-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#0d9488]/20 transition-all duration-300">
      <div className="flex items-start gap-4">
        <button
          onClick={togglePlay}
          className="shrink-0 mt-0.5 w-12 h-12 rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0f766e] text-white flex items-center justify-center shadow-md shadow-[#0d9488]/20 hover:shadow-lg hover:shadow-[#0d9488]/30 hover:scale-105 active:scale-95 transition-all duration-300"
          aria-label={isPlaying ? "Wstrzymaj" : "Odtwórz"}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 truncate">
              Przykładowa rozmowa z asystentem WitaLine
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Posłuchaj, jak brzmi nasza automatyczna recepcja AI
            </p>
          </div>

          <div className="flex items-center gap-4 h-10">
            <div className="flex-1 flex items-end gap-[2px] h-full py-1">
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(h * 100, 8)}%`,
                    backgroundColor: isPlaying
                      ? `rgba(60, 191, 74, ${0.3 + h * 0.6})`
                      : `rgba(161, 161, 170, ${0.15 + h * 0.25})`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tabular-nums text-zinc-500">
              {formatTime(Math.min(currentTime, DURATION))}
            </span>
            <div className="flex-1 mx-3 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0d9488] to-[#0f766e] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-mono tabular-nums text-zinc-400">
              {formatTime(DURATION)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
