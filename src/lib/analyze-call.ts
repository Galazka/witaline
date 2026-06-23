import { supabaseAdmin } from "@/lib/supabase-admin";

export interface CallAnalysis {
  qualityScore: number;
  quickSummary: string;
}

export async function analyzeCall(
  transcript: string,
  summary: string,
  callLogId: string
): Promise<CallAnalysis | null> {
  const textToAnalyze = (summary || transcript || "").slice(0, 4000);
  if (!textToAnalyze) return null;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("[analyze-call] OPENROUTER_API_KEY not set, skipping analysis");
    return null;
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://witaline.pl",
        "X-Title": "WitaLine Call Analyzer",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Jesteś analitykiem jakości rozmów telefonicznych. Oceniasz rozmowę w skali 1-10 i dajesz jednozdaniowe podsumowanie po polsku. Kryteria: profesjonalizm, skuteczność, empatia, satysfakcja klienta. Odpowiedz TYLKO w formacie JSON: {\"score\": 8, \"summary\": \"Krótkie podsumowanie.\"}",
          },
          {
            role: "user",
            content: `Oceń jakość tej rozmowy:\n\n${textToAnalyze}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn("[analyze-call] OpenRouter error:", err);
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    const cleaned = content.replace(/```json|```/g, "").trim();

    let parsed: { score?: number; summary?: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const scoreMatch = cleaned.match(/["']?score["']?\s*[:=]\s*(\d+)/i);
      const summaryMatch = cleaned.match(/["']?summary["']?\s*[:=]\s*["']([^"']+)["']/i);
      parsed = {
        score: scoreMatch ? parseInt(scoreMatch[1], 10) : undefined,
        summary: summaryMatch ? summaryMatch[1] : cleaned.slice(0, 100),
      };
    }

    const qualityScore = Math.max(1, Math.min(10, parsed.score || 5));
    const quickSummary = (parsed.summary || "").slice(0, 200);

    await supabaseAdmin
      .from("call_logs")
      .update({ quality_score: qualityScore, quick_summary: quickSummary })
      .eq("id", callLogId);

    return { qualityScore, quickSummary };
  } catch (err) {
    console.warn("[analyze-call] error:", err instanceof Error ? err.message : String(err));
    return null;
  }
}
