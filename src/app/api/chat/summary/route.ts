import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request: Request) {
  const { conversationId, businessId } = await request.json();

  if (!conversationId || !businessId) {
    return NextResponse.json({ error: "Missing conversationId or businessId" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Premium check: only Pro/Enterprise can generate AI summaries
  const { data: biz } = await supabase
    .from("businesses")
    .select("current_plan")
    .eq("id", businessId)
    .single();

  if (biz && (biz.current_plan === "start_100")) {
    return NextResponse.json({ error: "Podsumowania AI dostępne w planach Pro i Enterprise" }, { status: 403 });
  }

  // Get all messages for this conversation
  const { data: messages, error } = await supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !messages || messages.length === 0) {
    return NextResponse.json({ error: "No messages found" }, { status: 404 });
  }

  // Build conversation text
  const conversationText = messages
    .map(m => `${m.role === "user" ? "Klient" : "Asystent"}: ${m.content}`)
    .join("\n\n");

  // Try AI summary via OpenRouter
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openrouterKey}`,
        },
        body: JSON.stringify({
          model: "qwen/qwen3.6-35b-a3b",
          messages: [
            {
              role: "system",
              content: `Jesteś ekspertem od podsumowywania rozmów biznesowych. Podsumuj poniższą rozmowę klienta z asystentem AI firmy. Bądź zwięzły ale kompletny. Użyj formatu:
- 📋 Temat: (główny temat rozmowy)
- 👤 Klient: (imię jeśli podane, czego chciał)
- ✅ Załatwione: (co zostało wykonane)
- ⚠️ Do follow-up: (co wymaga kontynuacji)
- 🏷️ Tagi: (kluczowe słowa)
- 💡 Sentiment: (pozytywny/neutralny/negatywny)`
            },
            {
              role: "user",
              content: `Podsumuj tę rozmowę:\n\n${conversationText.slice(0, 3000)}`
            }
          ],
          max_tokens: 400,
          temperature: 0.3,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const summary = data.choices?.[0]?.message?.content || "";

        if (summary) {
          // Save summary to conversation
          await supabase
            .from("conversations")
            .update({ summary })
            .eq("id", conversationId);

          return NextResponse.json({ summary, source: "ai" });
        }
      }
    } catch { /* fallback to basic */ }
  }

  // Fallback: basic summary
  const userMessages = messages.filter(m => m.role === "user");
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || "";
  const firstUserMsg = userMessages[0]?.content || "";

  const basicSummary = `📋 Temat: ${firstUserMsg.slice(0, 100)}
👤 Klient: Nowy klient
✅ Załatwione: Obsłużono ${messages.length} wiadomości
⚠️ Do follow-up: Brak
🏷️ Tagi: czat, AI
💡 Sentiment: neutralny`;

  await supabase
    .from("conversations")
    .update({ summary: basicSummary })
    .eq("id", conversationId);

  return NextResponse.json({ summary: basicSummary, source: "basic" });
}
