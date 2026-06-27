"use client";

import { useState, useCallback, useEffect } from "react";
import { useConversationControls, useConversationStatus, useConversationMode, useConversation, ConversationProvider } from "@elevenlabs/react";

function MicIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function EndCallIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function VoiceAgentContent({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const controls = useConversationControls();
  const { status: connStatus } = useConversationStatus();
  const { mode } = useConversationMode();
  const { message } = useConversation();

  // Sync connection status
  useEffect(() => {
    if (connStatus === "connected") { setStatus("connected"); setError(null); }
    else if (connStatus === "connecting") { setStatus("connecting"); setError(null); }
    else if (connStatus === "disconnected") { setStatus("disconnected"); setTranscript(""); setIsSpeaking(false); setIsListening(false); setCallDuration(0); }
    else if (connStatus === "error") { setStatus("error"); }
  }, [connStatus]);

  // Sync speaking/listening mode
  useEffect(() => {
    setIsSpeaking(mode === "speaking");
    setIsListening(mode === "listening");
  }, [mode]);

  // Call duration timer
  useEffect(() => {
    if (status !== "connected") return;
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Live transcript from ElevenLabs
  useEffect(() => {
    if (message && status === "connected") {
      setTranscript(message);
    }
  }, [message, status]);

  const startConversation = useCallback(async () => {
    try {
      setError(null);
      setStatus("connecting");
      const tokenRes = await fetch("/api/elevenlabs/token");
      if (!tokenRes.ok) throw new Error("Nie udalo sie pobrac tokenu.");
      const { agentId } = await tokenRes.json();
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await controls.startSession({ agentId, connectionType: "websocket" });
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Nie udalo sie uruchomic polaczenia.");
    }
  }, [controls]);

  const stopConversation = useCallback(() => {
    controls.endSession();
    setTranscript("");
  }, [controls]);

  const isActive = status === "connected";

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Pulsing ring when active */}
      <div className="relative">
        {isActive && (
          <>
            <div className="absolute inset-0 rounded-full animate-ping bg-[#0d9488]/20" style={{ width: "120%", height: "120%", top: "-10%", left: "-10%" }} />
            <div className="absolute inset-0 rounded-full animate-pulse bg-[#0d9488]/10" style={{ width: "140%", height: "140%", top: "-20%", left: "-20%", animationDelay: "0.5s" }} />
          </>
        )}
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full animate-ping bg-[#0d9488]/30" style={{ width: "160%", height: "160%", top: "-30%", left: "-30%", animationDuration: "1.5s" }} />
        )}
        <button
          onClick={isActive ? stopConversation : startConversation}
          disabled={status === "connecting"}
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
            isActive ? "bg-red-500 hover:bg-red-600 shadow-red-500/30" :
            status === "connecting" ? "bg-[#0d9488]" :
            "bg-[#0d9488] hover:bg-[#0f766e] shadow-[#0d9488]/30"
          }`}
          style={{ color: "white" }}
          aria-label={isActive ? "Rozlacz" : "Polacz"}
        >
          {status === "connecting" ? <Spinner /> : isActive ? <EndCallIcon /> : <PhoneIcon />}
        </button>

        {/* Call timer badge */}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 shadow-sm rounded-full px-2.5 py-0.5 flex items-center gap-1.5 whitespace-nowrap z-20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-zinc-700 tabular-nums">{formatTime(callDuration)}</span>
          </div>
        )}
      </div>

      {/* Status text */}
      <p className={`text-sm font-medium transition-colors ${isActive ? (isSpeaking ? "text-[#0d9488]" : "text-amber-600") : "text-zinc-500"}`}>
        {status === "connecting" ? "Laczenie..." :
         isActive ? (isSpeaking ? "Maja mowi..." : "Slucham...") :
         status === "error" ? "Blad polaczenia" :
         "Rozmawiaj z Maja"}
      </p>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl text-center max-w-xs animate-fade-in">{error}</p>
      )}

      {/* Live transcript while connected */}
      {isActive && transcript && (
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-3 max-w-xs w-full animate-fade-in-up">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Transkrypcja na żywo
          </p>
          <p className="text-sm text-zinc-700 leading-relaxed">{transcript}</p>
        </div>
      )}
    </div>
  );
}

export default function VoiceAgent({ className = "" }: { className?: string }) {
  return (
    <ConversationProvider
      onConnect={() => console.log("[VoiceAgent] connected")}
      onDisconnect={() => console.log("[VoiceAgent] disconnected")}
      onMessage={(message) => { /* handled via hooks */ }}
      onError={(message: string) => console.error("[VoiceAgent] error:", message)}
    >
      <VoiceAgentContent className={className} />
    </ConversationProvider>
  );
}
