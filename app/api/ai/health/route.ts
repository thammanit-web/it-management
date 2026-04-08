import { NextResponse } from "next/server";
import { checkProvidersHealth } from "@/lib/ai/ai-provider";

export async function GET() {
  try {
    const health = await checkProvidersHealth();
    return NextResponse.json({ providers: health, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
