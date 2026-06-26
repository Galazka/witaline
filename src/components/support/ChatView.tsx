"use client";

import { useState, useEffect, useRef } from "react";
import MessageInput from "./MessageInput";
import type { Conversation, SupportAgent } from "./SupportLayout";
import { createClient } from "@/lib/supabase";

interface Message {
  id: string;
  conversation_id: string;
  sender_type: "agent" | "business" | "system";
  sender_id: string | null;
  sender_name: string | null;
  content: string;
  created_at: string;
}

interface Props {
  conversation: Conversation;
  agent: SupportAgent | null;
  onUpdate: () => void;
}

export default function ChatView({ conversation, agent, onUpdate }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMessages();
  }, [conversation.id]);

  // Real-time subscription via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`support-conv-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    setLoading(true);
    try {
      const res = await fetch(`/api/support/messages?conversation_id=${conversation.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (e) {
      console.error("Failed to fetch messages", e);
    }
    setLoading(false);
  }

  async function handleClose() {
    await fetch(`/api/support/conversations/${conversation.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    onUpdate();
  }

  async function handleReopen() {
    await fetch(`/api/support/conversations/${conversation.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "open" }),
    });
    onUpdate();
  }

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-700 bg-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-white font-medium text-sm">
            {conversation.business?.name || "Nieznana firma"}
          </h2>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
            {conversation.customer_name && <span>{conversation.customer_name}</span>}
            {conversation.customer_phone && <span>• {conversation.customer_phone}</span>}
            {conversation.source === "transfer" && <span>• z rozmowy telefonicznej</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation.status === "closed" ? (
            <button
              onClick={handleReopen}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-400/20 text-brand-400 hover:bg-brand-400/30 transition"
            >
              Otwórz ponownie
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
            >
              Zakończ
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-zinc-800 rounded-xl h-10 w-3/4" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-zinc-500 text-xs mt-10">
            Brak wiadomości. Rozpocznij rozmowę.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === "agent" ? "justify-end" : msg.sender_type === "system" ? "justify-center" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                  msg.sender_type === "agent"
                    ? "bg-brand-400 text-white rounded-br-sm"
                    : msg.sender_type === "system"
                    ? "bg-zinc-800 text-zinc-400 text-xs text-center rounded-full px-4"
                    : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                }`}
              >
                {msg.sender_type !== "system" && msg.sender_name && (
                  <div className="text-[10px] opacity-70 mb-0.5">{msg.sender_name}</div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className="text-[10px] opacity-50 text-right mt-0.5">
                  {new Date(msg.created_at).toLocaleTimeString("pl-PL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {conversation.status !== "closed" && (
        <MessageInput conversationId={conversation.id} />
      )}
    </>
  );
}