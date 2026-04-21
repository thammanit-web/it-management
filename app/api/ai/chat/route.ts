import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { aiChat } from "@/lib/ai/ai-provider";
import { prisma } from "@/lib/prisma";

async function buildITContext(userId?: string): Promise<string> {
  const contextParts: string[] = [];

  try {
    // 1. Fetch IT Knowledge Base Notes (Public Only for speed)
    const notes = await prisma.itNote.findMany({
      where: { isPublished: true },
      include: { details: { orderBy: { order: "asc" } } },
      take: 500,
      orderBy: { updatedAt: "desc" },
    });

    if (notes.length > 0) {
      const notesSummary = notes
        .map((n) => {
          const detailLines = n.details.map((d) => `  - ${d.label}: ${d.value}`).join("\n");
          return `[Knowledge: ${n.title}]\n${n.content || ""}\n${detailLines}`;
        })
        .join("\n\n");
      contextParts.push(`=== IT Knowledge Base ===\n${notesSummary}\n=== End Knowledge ===`);
    }

    // 2. Fetch Equipment & Consumables Stock (Summary)
    const equipmentStock = await prisma.equipmentList.findMany({
      include: { equipmentEntry: true },
      where: { remaining: { gt: 0 } }, // Only fetch available items for speed/relevance
      take: 200,
    });

    if (equipmentStock.length > 0) {
      const eqMap: Record<string, number> = {};
      equipmentStock.forEach((item) => {
        const key = `${item.equipmentEntry?.list || "Item"} (${item.equipmentEntry?.brand_name || "-"})`;
        eqMap[key] = (eqMap[key] || 0) + item.remaining;
      });

      let eqText = "=== IT Stock Inventory Summary ===\n";
      Object.entries(eqMap).forEach(([name, count]) => {
        eqText += `- ${name}: ${count} available\n`;
      });
      eqText += "=== End Stock ===";
      contextParts.push(eqText);
    }

    return contextParts.join("\n\n");
  } catch (error) {
    console.error("[AI Context] Error:", error);
    return "Error gathering IT context.";
  }
}

const BASE_SYSTEM_PROMPT = `You are the "IT Assistant Bot" for NDC IT System.

### 1. LANGUAGE & COMMUNICATION (CRITICAL)
- **Match Language:** Detect the user's language. If they ask in Thai, respond ONLY in Thai. If they ask in English, respond ONLY in English. No bilingual responses.
- **Simplicity First:** Use simple, non-technical language (Layman terms). Avoid IT jargon. Imagine you are explaining to someone who has no IT background.

### 2. CAPABILITIES
- **Knowledge Base:** Use the provided "IT Knowledge Base" to answer questions.
- **Stock Checking:** Use the "IT Stock Inventory Summary" to answer if items are available. 
- **Troubleshooting:** Provide basic steps for technical issues.

### 3. TECHNICAL SUPPORT GUIDELINES
- **Process:** Always provide 2-3 EASY troubleshooting steps FIRST. 
- **Wait/Contact:** If issues persist, suggest contacting the IT Dept.

### 4. STYLE & TONE
- **Tone:** Friendly, professional, and patient.
- **No Jargon:** Instead of "Check your DHCP lease," say "Try to turn your WiFi off and on again."
- **Uncertainty:** If you don't know the answer, politely suggest contacting IT.`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const itContext = await buildITContext(userId);
    const systemPrompt = BASE_SYSTEM_PROMPT + "\n\n" + itContext;

    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.slice(-6), // Short history for maximum speed
    ];

    const result = await aiChat(aiMessages);

    return NextResponse.json({
      content: result.content,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    console.error("[AI Chat] Error:", error);
    return NextResponse.json(
      { error: "Chat failed", details: String(error) },
      { status: 500 }
    );
  }
}

