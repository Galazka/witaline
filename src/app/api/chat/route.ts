import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { toolDefinitions, toolHandlers, getToolContext } from "@/lib/tools";
import { rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string | null;
  tool_calls?: { id: string; type: string; function: { name: string; arguments: string } }[];
}

interface ToolMessage {
  role: "tool";
  tool_call_id: string;
  content: string;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function buildApiMessages(
  systemPrompt: string,
  history: { role: string; content: string }[],
  currentMessages: ChatMessage[],
  toolResults?: ToolMessage[]
): (ChatMessage | ToolMessage)[] {
  const msgs: (ChatMessage | ToolMessage)[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-15).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ...currentMessages.slice(-10).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
    })),
  ];
  if (toolResults) msgs.push(...toolResults);
  return msgs;
}

async function callOpenRouter(
  messages: (ChatMessage | ToolMessage)[],
  includeTools: boolean
): Promise<{ data?: { choices: { message: ChatMessage }[] }; error?: string }> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { error: "No API key" };

  const body: Record<string, unknown> = {
    model: "deepseek/deepseek-chat-v4-flash",
    messages,
    max_tokens: 800,
    temperature: 0.7,
  };
  if (includeTools) body.tools = toolDefinitions;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return { error: `OpenRouter ${res.status}: ${text.slice(0, 200)}` };
  }

  return { data: await res.json() };
}

async function saveMessage(
  supabase: ReturnType<typeof getSupabase>,
  convId: string,
  businessId: string,
  role: string,
  content: string,
  metadata?: Record<string, unknown>
) {
  const { data } = await supabase
    .from("messages")
    .insert({ conversation_id: convId, business_id: businessId, role, content, metadata: metadata || {} })
    .select("id")
    .single();
  return data?.id as string | undefined;
}

async function incrementMessageCount(supabase: ReturnType<typeof getSupabase>, convId: string) {
  try {
    await supabase.rpc("increment_column", {
      table_name: "conversations", column_name: "message_count", row_id: convId,
    });
  } catch {
    const { data: convData } = await supabase.from("conversations")
      .select("message_count").eq("id", convId).single();
    if (convData) {
      await supabase.from("conversations")
        .update({ message_count: (convData.message_count || 0) + 1 })
        .eq("id", convId);
    }
  }
}

export async function POST(request: Request) {
  // Rate limit: 30 requests per minute per IP
  const rl = rateLimitResponse(request, "chat", { windowMs: 60_000, maxRequests: 30 });
  if (rl) return rl;

  const { messages, systemPrompt, businessName, conversationId, businessId, channel } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing messages array" }, { status: 400 });
  }

  const prompt = systemPrompt || `Jesteś asystentem AI firmy "${businessName || "WitaLine"}". Odpowiadaj po polsku, krótko i rzeczowo.`;
  const chatChannel = channel || (businessId === WITALINE_MAIN_BUSINESS_ID ? "widget" : "web");

  const supabase = getSupabase();
  let convId = conversationId;

  // Create or get conversation
  if (businessId && !convId) {
    const { data: conv } = await supabase
      .from("conversations")
      .insert({ business_id: businessId, channel: chatChannel, status: "active" })
      .select("id")
      .single();
    convId = conv?.id;
  }

  // Save user message to DB
  if (convId && businessId) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "user") {
      await saveMessage(supabase, convId, businessId, "user", lastMsg.content);
      await incrementMessageCount(supabase, convId);
    }
  }

  // Load recent conversation history
  let dbHistory: { role: string; content: string }[] = [];
  if (convId) {
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);
    if (recentMessages) dbHistory = recentMessages;
  }

  // ── Tool calling loop ──────────────────────────────────────

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey && businessId) {
    const ctx = getToolContext(businessId, businessName);
    const currentMsgs: ChatMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    let toolResults: ToolMessage[] | undefined;
    let finalReply = "";
    let usedTools = false;
    let iterations = 0;
    const MAX_ITER = 5;

    while (iterations < MAX_ITER) {
      iterations++;
      const apiMsgs = buildApiMessages(prompt, dbHistory, currentMsgs, toolResults);
      const shouldIncludeTools = iterations === 1;

      const result = await callOpenRouter(apiMsgs, shouldIncludeTools);
      if (result.error || !result.data) {
        if (iterations === 1) break; // fall back to pattern matching
        finalReply = "Przepraszam, wystąpił błąd. Spróbuj ponownie.";
        break;
      }

      const choice = result.data.choices?.[0]?.message;
      if (!choice) {
        if (iterations === 1) break;
        finalReply = "Przepraszam, nie mogłem przetworzyć odpowiedzi.";
        break;
      }

      // Handle tool calls
      if (choice.tool_calls && choice.tool_calls.length > 0) {
        usedTools = true;
        toolResults = [];

        for (const tc of choice.tool_calls) {
          const handler = toolHandlers[tc.function.name];
          if (!handler) {
            toolResults.push({
              role: "tool",
              tool_call_id: tc.id,
              content: `Nieznane narzędzie: ${tc.function.name}`,
            });
            continue;
          }

          let args: Record<string, unknown> = {};
          try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }

          const resultStr = await handler(args, ctx);
          toolResults.push({ role: "tool", tool_call_id: tc.id, content: resultStr });
        }

        // Save tool calls to DB as system message (metadata records the details)
        if (convId && businessId) {
          await saveMessage(supabase, convId, businessId, "system",
            `AI wywołał narzędzia: ${choice.tool_calls.map(t => t.function.name).join(", ")}`,
            { tool_calls: choice.tool_calls.map(t => ({ name: t.function.name, args: t.function.arguments })) }
          );
          await incrementMessageCount(supabase, convId);
        }

        continue;
      }

      // Got final content
      if (choice.content) {
        finalReply = choice.content;
        break;
      }

      if (iterations === 1) break;
      finalReply = "Przepraszam, nie zrozumiałem.";
      break;
    }

    if (finalReply) {
      let messageId: string | undefined;
      if (convId && businessId) {
        messageId = await saveMessage(supabase, convId, businessId, "assistant", finalReply);
        await incrementMessageCount(supabase, convId);
      }
      return NextResponse.json({
        reply: finalReply,
        source: usedTools ? "deepseek-v4-flash/tools" : "deepseek-v4-flash",
        conversationId: convId,
        messageId,
      });
    }
  }

  // ── Smart fallback ─────────────────────────────────────────

  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
  const reply = generateSmartReply(lastMsg, prompt, businessName || "WitaLine");

  let messageId: string | undefined;
  if (convId && businessId) {
    messageId = await saveMessage(supabase, convId, businessId, "assistant", reply);
    await incrementMessageCount(supabase, convId);
  }

  return NextResponse.json({ reply, source: "fallback", conversationId: convId, messageId });
}

function generateSmartReply(userMsg: string, systemPrompt: string, bizName: string): string {
  const promptLower = systemPrompt.toLowerCase();

  if (userMsg.match(/^(dzień dobry|witam|cześć|siema|hej|hello|hi)/)) {
    return `Dzień dobry! Witamy w ${bizName}. W czym mogę pomóc?`;
  }

  if (userMsg.match(/(cen|cennik|ile koszt|koszt|oplata|platn|cena|darmow|bezpłat|trial|okres prób|test)/)) {
    if (promptLower.includes("79") || promptLower.includes("start")) {
      return `Oferujemy 3 plany:\n\n🟢 **Start** — 79 zł/mies (100 min)\n🔵 **Pro** — 249 zł/mies (500 min)\n🟣 **Enterprise** — 599 zł/mies (2000 min, FUP)\n\nKażdy plan obejmuje dedykowany numer i asystenta AI 24/7. Chcesz wybrany plan?`;
    }
    return `Ceny zależą od wybranego planu. Mogę podać szczegóły — jaki plan Cię interesuje?`;
  }

  if (userMsg.match(/(witaline|co to|jak dział|co oferuj|co rob|usług|asystent|bot|ai|recepcjonist|telefon|numer)/)) {
    return `WitaLine to automatyczna recepcja AI, która:\n\n📞 Odbiera telefony 24/7\n🤖 Przyjmuje zamówienia i rezerwacje\n📊 Daje panel z transkrypcjami i statystykami\n💬 Ma widget na stronę www\n\nWszystko na własnym numerze, konfiguracja w 5 minut. Jaki aspekt Cię interesuje?`;
  }

  if (userMsg.match(/(szybko|jak zaczą|start|rejestr|załóż|aktyw|konfigur)/)) {
    return `Rejestracja zajmuje 5 minut:\n1. Wybierasz plan\n2. Zakładasz konto\n3. Podajesz stronę www (AI ją skanuje)\n4. Gotowe — asystent odbiera telefony!\n\nMożesz też przenieść własny numer. Chcesz zacząć?`;
  }

  if (userMsg.match(/(godzin|otwart|czynn|dostępn|kiedy|kiedy czynn)/)) {
    const hoursMatch = systemPrompt.match(/godzin[\s\S]{0,200}/i);
    if (hoursMatch) return `Nasze godziny pracy to:\n${hoursMatch[0].slice(0, 200)}\n\nAsystent AI jest dostępny 24/7!`;
    return `Asystent AI jest dostępny **24 godziny na dobę, 7 dni w tygodniu**. Nigdy nie odbierasz nieodebranych połączeń!`;
  }

  if (userMsg.match(/(telefon|kontakt|numer|email|adres|where|gdzie|dzwon)/)) {
    const phoneMatch = systemPrompt.match(/(\+48\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}|\d{3}[\s-]\d{3}[\s-]\d{3})/);
    const emailMatch = systemPrompt.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    let response = "Nasz asystent AI jest dostępny pod numerem przypisanym do Twojego konta. ";
    if (phoneMatch) response += `Telefon: ${phoneMatch[1]}\n`;
    if (emailMatch) response += `Email: ${emailMatch[1]}\n`;
    response += "\nMożesz też napisać na czacie — jestem tu dla Ciebie!";
    return response;
  }

  if (userMsg.match(/(usług|co rob|zakres|specjaliz|oferta|menu|produkt)/)) {
    const servicesMatch = systemPrompt.match(/(?:usługi|oferta|zakres|menu)[\s\S]{0,500}/i);
    if (servicesMatch) return `Oferujemy:\n${servicesMatch[0].slice(0, 400)}\n\nCzy chcesz umówić wizytę lub zamówić coś?`;
    return `Chętnie opowiem o naszej ofercie. O czym konkretnie chcesz się dowiedzieć?`;
  }

  if (userMsg.match(/(rezerw|umów|termin|wizyt|zamów|booking)/)) {
    return `Oczywiście, chętnie umówię wizytę! Podaj mi:\n\n📅 Preferowany termin\n🕐 Godzinę\n👤 Imię i nazwisko\n📞 Numer telefonu\n\nA wszystko potwierdzimy SMS-em!`;
  }

  if (userMsg.match(/(problem|reklamac|skarg|źle|zły|nie działa|bug|error)/)) {
    return `Przepraszam za problemy. Przekazuję zgłoszenie do zespołu. Podaj proszę:\n\n1. Opis problemu\n2. Numer telefonu lub email\n\nSkontaktujemy się najszybciej jak to możliwe.`;
  }

  if (userMsg.match(/(dzięk|dziękuj|thanks|thx|super|świetnie|ok|okej)/)) {
    return `Nie ma za co! Czy mogę jeszcze w czymś pomóc? Jestem tu 24/7.`;
  }

  if (userMsg.match(/(do widzenia|pa|cześć|nara|żegnaj|bye)/)) {
    return `Do widzenia! Miłego dnia. Pamiętaj — jestem dostępny 24/7, wystarczy zadzwonić! 👋`;
  }

  const contextHint = systemPrompt.includes("restaurac") ? "kulinarny" :
    systemPrompt.includes("salon") ? "beauty" :
    systemPrompt.includes("gabinet") ? "medyczny" :
    systemPrompt.includes("warsztat") ? "motoryzacyjny" :
    systemPrompt.includes("prawn") ? "prawny" :
    systemPrompt.includes("fitness") ? "fitness" : "ogólny";

  return `Rozumiem Twoje pytanie. Nasz asystent jest specjalistą w branży ${contextHint}. Mogę pomóc z:\n\n• Zamówieniami i rezerwacjami\n• Informacjami o usługach i cenach\n• Godzinami otwarcia\n• Kontaktami\n\nO czym chciałbyś się dowiedzieć więcej?`;
}
