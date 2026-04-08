import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { aiChat } from "@/lib/ai/ai-provider";
import { prisma } from "@/lib/prisma";
import { generateNewCode } from "@/lib/code-generator";

async function buildITContext(userId?: string): Promise<string> {
  const contextParts: string[] = [];

  try {
    // 0. Fetch User Basic Info (to get employeeId for assigned assets)
    let employeeId: string | null = null;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: true }
      });
      if (user?.employee) {
        employeeId = user.employee.id;
      }
    }

    // 1. Fetch IT Knowledge Base Notes (Public + User's Own)
    const notes = await prisma.itNote.findMany({
      where: userId ? {
        OR: [
          { isPublished: true },
          { userId: userId }
        ]
      } : { isPublished: true },
      include: { details: { orderBy: { order: "asc" } } },
      take: 50,
      orderBy: { updatedAt: "desc" },
    });

    if (notes.length > 0) {
      const notesSummary = notes
        .map((n) => {
          const detailLines = n.details
            .map((d) => `  - ${d.label}: ${d.value}`)
            .join("\n");
          return `[${n.title}]${n.isPublished ? "" : " (Private Note)"}\n${n.content || ""}\n${detailLines}`;
        })
        .join("\n\n");
      contextParts.push(`=== IT Knowledge Base & Notes ===\n${notesSummary}\n=== End Knowledge ===`);
    }

    // 2. User Personalized Context (Tickets & Borrowing)
    if (userId) {
      // Recent IT Support Tickets (IT Request)
      const myTickets = await prisma.request.findMany({
        where: { userId: userId },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          request_code: true,
          type_request: true,
          status: true,
          createdAt: true,
          approval_status: true,
          it_approval_status: true,
        }
      });

      if (myTickets.length > 0) {
        let ticketText = `=== My Recent IT Support Tickets (Requests) ===\n`;
        myTickets.forEach(t => {
          ticketText += `- [${t.request_code}] ${t.type_request}: Status ${t.status} (Appr: ${t.approval_status || 'Pending'}, IT: ${t.it_approval_status || 'Pending'}) - Created ${t.createdAt.toLocaleDateString()}\n`;
        });
        contextParts.push(ticketText);
      }

      // Recent Equipment Borrowing/Requests (IT Borrow)
      const myBorrows = await prisma.equipmentRequest.findMany({
        where: { userId: userId },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          equipment_code: true,
          manual_item_name: true,
          quantity: true,
          approval_status: true,
          it_approval_status: true,
          createdAt: true,
        }
      });

      if (myBorrows.length > 0) {
        let borrowText = `=== My Recent Equipment Requests (IT Borrow) ===\n`;
        myBorrows.forEach(b => {
          borrowText += `- [${b.equipment_code}] ${b.manual_item_name} x${b.quantity}: User Appr: ${b.approval_status || 'Pending'}, IT Appr: ${b.it_approval_status || 'Pending'} - Created ${b.createdAt.toLocaleDateString()}\n`;
        });
        contextParts.push(borrowText);
      }

      // Assets currently assigned to this user
      if (employeeId) {
        const myAssets = await prisma.asset.findMany({
          where: { employeeId: employeeId },
          select: { asset_code: true, name: true, type: true, brand: true, model: true, status: true }
        });

        if (myAssets.length > 0) {
          let assetOwnedText = `=== My Currently Assigned Assets (My Devices) ===\n`;
          myAssets.forEach(a => {
            assetOwnedText += `- [${a.asset_code}] ${a.name} (${a.brand || ''} ${a.model || ''}): Status ${a.status}\n`;
          });
          contextParts.push(assetOwnedText);
        }
      }
    }

    // 3. Detailed IT Assets Inventory (Global)
    const assets = await prisma.asset.findMany({
      select: {
        asset_code: true,
        type: true,
        brand: true,
        model: true,
        status: true,
        name: true,
        employee: {
          select: {
            employee_name_th: true
          }
        }
      },
      take: 1000,
      orderBy: { asset_code: "asc" }
    });

    if (assets.length > 0) {
      const assetSummary: Record<string, Record<string, number>> = {};
      assets.forEach(a => {
        const key = `${a.type} (${a.brand || 'No Brand'})`.trim();
        if (!assetSummary[key]) assetSummary[key] = {};
        assetSummary[key][a.status] = (assetSummary[key][a.status] || 0) + 1;
      });

      let assetText = "=== Detailed IT Asset Inventory (Global) ===\n";
      assetText += "Summary (Counts by Type/Status):\n";
      Object.entries(assetSummary).forEach(([item, statuses]) => {
        const statusStr = Object.entries(statuses).map(([s, c]) => `${s}: ${c}`).join(", ");
        assetText += `- ${item} [${statusStr}]\n`;
      });

      assetText += "\nIndividual Asset Listing (Asset Code | Name | Status | Holder):\n";
      assets.slice(0, 300).forEach(a => {
        const holder = a.employee?.employee_name_th || "None (In Storage)";
        const brandModel = `${a.brand || ""} ${a.model || ""}`.trim();
        assetText += `- ${a.asset_code} | ${a.name} (${brandModel}) | ${a.status} | ${holder}\n`;
      });
      
      if (assets.length > 300) {
        assetText += `- ... and ${assets.length - 300} more assets.\n`;
      }
      assetText += "=== End Global Assets ===";
      contextParts.push(assetText);
    }

    // 4. Equipment & Consumables Stock (Detailed Stock Levels)
    const equipmentStock = await prisma.equipmentList.findMany({
      include: { 
        equipmentEntry: {
          include: {
            purchaseOrder: true
          }
        } 
      },
      take: 1000,
    });

    if (equipmentStock.length > 0) {
      const eqMap: Record<string, { type: string, brand: string, remaining: number, detail: string }> = {};
      
      equipmentStock.forEach((item) => {
        const name = item.equipmentEntry?.list || "Unknown Item";
        const brand = item.equipmentEntry?.brand_name || "-";
        const type = item.equipmentEntry?.item_type || "OTHER";
        const detail = item.equipmentEntry?.purchaseOrder?.detail || "";
        const key = `${name} | Brand: ${brand}`;

        if (!eqMap[key]) {
          eqMap[key] = { type, brand, remaining: 0, detail };
        }
        eqMap[key].remaining += item.remaining;
      });

      let eqText = "=== IT Inventory & Stock (Detailed) ===\n";
      Object.entries(eqMap).forEach(([key, info]) => {
        const stockStatus = info.remaining > 0 ? `${info.remaining} units available` : "OUT OF STOCK";
        eqText += `- Item: ${key} [Type: ${info.type}]: ${stockStatus}${info.detail ? ` (${info.detail})` : ""}\n`;
      });
      eqText += "=== End Equipment Stock ===";
      contextParts.push(eqText);
    }

    // 5. Recent Purchase Orders
    const pendingPOs = await prisma.equipmentPurchaseOrder.findMany({
      where: { status: { in: ['PENDING', 'ORDERED'] } },
      select: { list: true, quantity: true, status: true, date_order: true },
      take: 50,
      orderBy: { date_order: "desc" }
    });

    if (pendingPOs.length > 0) {
      let poText = "=== Upcoming/Pending IT Orders (Not yet in stock) ===\n";
      pendingPOs.forEach(po => {
        poText += `- ${po.list}: ${po.quantity} requested (${po.status}) - Ordered on ${po.date_order.toLocaleDateString()}\n`;
      });
      poText += "=== End PO Context ===";
      contextParts.push(poText);
    }

    return contextParts.join("\n\n");
  } catch (error) {
    console.error("[AI Context] Error:", error);
    return "Error gathering IT context.";
  }
}

const BASE_SYSTEM_PROMPT = `You are "IT Assistant Bot" for NDC IT System — a helpful bilingual (Thai/English) IT support chatbot.

=== SMART ACTIONS (AGENTIC MODE) ===
You have the authority to process IT requests (Equiment/Consumables). If a user wants to borrow/request ("เบิก" หรือ "ยืม") an item:
1. Actively ask for missing details: 
   - Which Item? 
   - Quantity?
   - Reason for borrowing? 
   - Is it urgent? (High/Low priority)?
2. Only after you have ALL details (Item, Qty, Reason, Urgency), confirm clearly that you are submitting the request.
3. To trigger the ACTUAL submission, you MUST append this tag at the very end of your final response: 
   [[CREATE_ERQ: {"item": "...", "qty": 1, "reason": "...", "urgent": true/false}]]

Guidelines for Stock & Inventory Inquiries:
- Personal Data: Look at "My Recent IT Support Tickets", "My Recent Equipment Requests", and "My Currently Assigned Assets" to answer questions about the user's own status.
- Global Assets: Use "Detailed IT Asset Inventory (Global)" to answer questions about ANY device code, status, or holder.
- Consumables: Use "IT Inventory & Stock" for items like mice, keyboards, ink, etc.
- If an item is "OUT OF STOCK", inform the user but suggest they can still place a request so IT can prepare/order it.
- If in stock, encourage them to let you "Process the request" (เบิกอุปกรณ์) right here in the chat.

General Guidelines:
- Always respond in the same language the user writes in (Thai -> Thai, English -> English).
- Use professional, helpful, and friendly tone.
- If you don't know the answer based on context, politely suggest contacting the IT team.
- Keep the [[CREATE_ERQ: ...]] tag hidden from the main flow of user conversation but include it in the background response.`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    // Fetch personalized IT context dynamically
    const itContext = await buildITContext(userId);
    const systemPrompt = BASE_SYSTEM_PROMPT + "\n\n" + itContext;

    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.slice(-10),
    ];

    const result = await aiChat(aiMessages);
    let finalContent = result.content;
    let extraInfo = "";

    // Action Detector: Create Equipment Request
    const erqMatch = finalContent.match(/\[\[CREATE_ERQ: (.*?)\]\]/);
    if (erqMatch) {
      try {
        const actionData = JSON.parse(erqMatch[1]);
        const code = await generateNewCode('equipmentRequest');
        
        await prisma.equipmentRequest.create({
          data: {
            equipment_code: code,
            userId: (session.user as any).id,
            manual_item_name: actionData.item,
            quantity: Number(actionData.qty) || 1,
            reason: actionData.reason,
            remarks: `Automatically submitted by AI Assistant. [Urgent: ${actionData.urgent ? 'YES' : 'NO'}]`,
            borrow_type: "NEW", // Default for AI requests
          }
        });

        // Clean up the tag from user view and add confirmation
        finalContent = finalContent.replace(erqMatch[0], "").trim();
        extraInfo = `\n\n✅ (รหัสใบเบิกของคุณคือ: ${code} / Request Code: ${code})`;
      } catch (err) {
        console.error("AI Action parse/execute error:", err);
      }
    }

    return NextResponse.json({
      content: finalContent + extraInfo,
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

