"use client";

import { useState, useRef, KeyboardEvent } from "react";

interface Props {
  conversationId: string;
}

export default function MessageInput({ conversationId }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId, content: trimmed }),
      });
      setText("");
      inputRef.current?.focus();
    } catch (e) {
      console.error("Failed to send message", e);
    }
    setSending(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="p-3 border-t border-zinc-700 bg-zinc-800">
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Napisz wiadomość... (Enter to send, Shift+Enter new line)"
          rows={1}
          className="flex-1 bg-zinc-700 text-white text-sm rounded-xl px-3 py-2.5 placeholder-zinc-500 border border-zinc-600 focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488] outline-none resize-none"
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="shrink-0 bg-[#0d9488] text-white px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "..." : "Wyślij"}
        </button>
      </div>
    </div>
  );
}