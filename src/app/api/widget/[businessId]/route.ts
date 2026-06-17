import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch active knowledge entries from business_knowledge
  const { data: knowledge } = await supabaseAdmin
    .from("business_knowledge")
    .select("title, content, category, sort_order")
    .eq("business_id", businessId)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  // Merge knowledge into system prompt
  let enrichedPrompt = business.system_prompt || "";

  if (knowledge && knowledge.length > 0) {
    const knowledgeBlock = knowledge
      .map(k => `[${k.category}] ${k.title}: ${k.content}`)
      .join("\n");
    enrichedPrompt += `\n\n===== BAZA WIEDZY FIRMY =====\n${knowledgeBlock}`;
  }

  return NextResponse.json({
    name: business.name,
    systemPrompt: enrichedPrompt,
    menuCatalog: business.menu_catalog,
    agentId: process.env.ELEVENLABS_AGENT_ID,
    plan: business.current_plan,
  });
}
