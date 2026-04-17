import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { aiChat } from "@/lib/ai/ai-provider";

const SYSTEM_PROMPT = `You are an authoritative IT support classification engine.
Your task is to analyze a user's IT support request and ASSIGN the most appropriate Category and Priority.
You must return ONLY a JSON object (no markdown, no explanation).

Given:
- type_request: the type of request (e.g., REPAIR, SUPPORT, PASSWORD_ACCOUNT, etc.)
- description: what the user described
- reason: optional urgency reason from the user

Rules for Category:
- HARDWARE: Physical devices (computer, printer, mouse, keyboard, monitor, laptop, server, etc.)
- SOFTWARE: Applications, OS, drivers, licenses, errors in programs
- NETWORK: Internet, WiFi, VPN, LAN, network drives, email connectivity
- GENERAL: Account issues, password resets, general IT support, access, installation

Rules for Priority:
- HIGH: Global impact, complete failure affecting many people or critical production, keywords: "ทั้งโรงงาน", "ทุกคน", "ทั้งแผนก", security breach, urgent business impact, data loss risk. If an entire section or the whole factory is down, it MUST be HIGH.
- MEDIUM: Partial functionality, workaround possible, affects daily work moderately for ONE or FEW people.
- LOW: Minor issue, cosmetic, non-urgent, request for information, low business impact, individual convenience.

Return ONLY this JSON (no other text):
{
  "category": "HARDWARE" | "SOFTWARE" | "NETWORK" | "GENERAL",
  "priority": "LOW" | "MEDIUM" | "HIGH",
  "reasoning": "อธิบายเหตุผลสั้นๆ เป็นภาษาไทย 1 ประโยค ว่าทำไมเลือกค่าแบบนี้"
}`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { type_request, description, reason } = await req.json();

    if (!type_request || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userMessage = `Analyze this IT request:
type_request: ${type_request}
description: ${description}
reason: ${reason || "ไม่ระบุ"}`;

    const result = await aiChat([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ]);

    // Parse the JSON response
    let parsed: { category: string; priority: string; reasoning: string };
    try {
      // Strip any markdown code blocks just in case
      const cleaned = result.content
        .replace(/```json\n?/gi, "")
        .replace(/```\n?/gi, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw: result.content },
        { status: 502 }
      );
    }

    // Validate values
    const validCategories = ["HARDWARE", "SOFTWARE", "NETWORK", "GENERAL"];
    const validPriorities = ["LOW", "MEDIUM", "HIGH"];

    if (!validCategories.includes(parsed.category)) parsed.category = "GENERAL";
    if (!validPriorities.includes(parsed.priority)) parsed.priority = "MEDIUM";

    return NextResponse.json({
      category: parsed.category,
      priority: parsed.priority,
      reasoning: parsed.reasoning,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    console.error("[AI Suggest] Error:", error);
    return NextResponse.json(
      { error: "AI suggestion failed", details: String(error) },
      { status: 500 }
    );
  }
}
