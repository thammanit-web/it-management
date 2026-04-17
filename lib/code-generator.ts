import { prisma as defaultPrisma } from "./prisma";

/**
 * Generates a sequential code in the format: [TYPE]-[YYYYMM]-[RUNNING_NO]
 * e.g., REQ-202403-0001
 * 
 * Safety & Performance: 
 * - Uses findFirst with orderBy desc for efficiency.
 * - Supports being run within a Prisma transaction.
 */
export async function generateNewCode(
  model: 'request' | 'equipmentRequest' | 'equipmentGroup' | 'purchaseOrder' | 'equipmentList' | 'incidentReport',
  tx?: any
) {
  const prisma = tx || defaultPrisma;
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  
  // Mapping types to prefixes
  const typeMap: Record<string, string> = {
    request: 'REQ',
    equipmentRequest: 'ERQ',
    equipmentGroup: 'EBG',
    purchaseOrder: 'PO',
    equipmentList: 'EQ',
    incidentReport: 'INC'
  };

  const type = typeMap[model] || 'GEN';
  const dateStr = `${yyyy}${mm}`;
  const prefix = `${type}-${dateStr}-`;

  let lastCode: string | null = null;

  // Optimized fetching: only get the latest one
  if (model === 'request') {
    const last = await prisma.request.findFirst({
      where: { request_code: { startsWith: prefix } },
      orderBy: { request_code: 'desc' },
      select: { request_code: true },
    });
    lastCode = last?.request_code || null;
  } else if (model === 'equipmentRequest') {
    const last = await prisma.equipmentRequest.findFirst({
      where: { equipment_code: { startsWith: prefix } },
      orderBy: { equipment_code: 'desc' },
      select: { equipment_code: true },
    });
    lastCode = last?.equipment_code || null;
  } else if (model === 'equipmentGroup') {
    const last = await prisma.equipmentBorrowGroup.findFirst({
      where: { group_code: { startsWith: prefix } },
      orderBy: { group_code: 'desc' },
      select: { group_code: true },
    });
    lastCode = last?.group_code || null;
  } else if (model === 'purchaseOrder') {
    const last = await prisma.equipmentPurchaseOrder.findFirst({
      where: { po_code: { startsWith: prefix } },
      orderBy: { po_code: 'desc' },
      select: { po_code: true },
    });
    lastCode = last?.po_code || null;
  } else if (model === 'equipmentList') {
    const last = await prisma.equipmentList.findFirst({
      where: { eq_code: { startsWith: prefix } },
      orderBy: { eq_code: 'desc' },
      select: { eq_code: true },
    });
    lastCode = last?.eq_code || null;
  } else if (model === 'incidentReport') {
    const last = await prisma.incidentReport.findFirst({
      where: { report_code: { startsWith: prefix } },
      orderBy: { report_code: 'desc' },
      select: { report_code: true },
    });
    lastCode = last?.report_code || null;
  }

  let sequence = 1;
  if (lastCode) {
    const parts = lastCode.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      sequence = lastNum + 1;
    }
  }

  // Padding with 4 digits for robustness: 0001, 0002, ...
  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}

// Backward compatibility or specialized helpers (now using the same underlying logic)
export async function generatePOCode() {
  return generateNewCode('purchaseOrder');
}

export async function generateEQCode() {
  return generateNewCode('equipmentList');
}