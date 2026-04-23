/**
 * Generate a Word (.docx) user manual from images in public/Manual/.
 * Usage: node scratch/generate-manual.js
 * Output: docs/คู่มือการใช้งานระบบ-IT-System.docx
 */

const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

const ROOT = path.resolve(__dirname, "..");
const MANUAL_DIR = path.join(ROOT, "public", "Manual");
const OUT_DIR = path.join(ROOT, "docs");
const OUT_FILE = path.join(OUT_DIR, "คู่มือการใช้งานระบบ-IT-System.docx");

/**
 * Section schema:
 *   heading : หัวข้อ
 *   purpose : วัตถุประสงค์ของหน้าจอ (1 ประโยคสั้น)
 *   steps   : ขั้นตอนการใช้งาน (array ของ string; ขึ้นต้นด้วยเลขข้อไม่ต้อง)
 *   notes   : หมายเหตุ/ข้อพึงทราบ (array ของ string, optional)
 *   image   : ชื่อไฟล์รูปใน public/Manual/
 */
const SECTIONS = [
  {
    heading: "บทที่ 1  การเข้าสู่ระบบ",
    purpose: "เริ่มต้นการใช้งานระบบ IT System",
    steps: [
      "เปิดหน้าเว็บของระบบ IT System",
      "กรอกชื่อผู้ใช้ (Username) ในช่องแรก",
      "กรอกรหัสผ่าน (Password) ในช่องที่สอง",
      "กดปุ่ม เข้าสู่ระบบ เพื่อเข้าใช้งาน",
    ],
    notes: [
      "หากลืมรหัสผ่านหรือยังไม่มีบัญชี กรุณาติดต่อฝ่ายไอที",
      "เมื่อเข้าสู่ระบบสำเร็จ ระบบจะพาไปยังหน้าหลัก (Dashboard) โดยอัตโนมัติ",
    ],
    image: "Login.jpeg",
  },
  {
    heading: "บทที่ 2  หน้าหลัก (Dashboard)",
    purpose: "หน้าจอภาพรวมของระบบ",
    steps: [
      "ดูสรุปจำนวนคำร้อง สถานะการอนุมัติ และสต๊อกอุปกรณ์",
      "ดูกิจกรรมล่าสุดของตนเอง และประกาศจากฝ่ายไอที",
      "ใช้แถบเมนูด้านซ้ายเพื่อไปยังหน้าต่าง ๆ ของระบบ",
    ],
    notes: [
      "สามารถเลือกกรองข้อมูลตามเดือนได้ที่ส่วนกิจกรรม",
    ],
    image: "Dashboard.jpeg",
  },
  {
    heading: "บทที่ 3  การเปลี่ยนภาษา",
    purpose: "สลับภาษาของระบบระหว่างไทยและอังกฤษ",
    steps: [
      "ไปที่มุมขวาบนของหน้าจอ ถัดจากไอคอนผู้ใช้",
      "กดปุ่มเลือกภาษา เพื่อสลับระหว่าง TH และ EN",
    ],
    notes: [
      "ระบบจะจดจำภาษาที่เลือกไว้ในครั้งถัดไป",
    ],
    image: "เปลี่ยนเป็นภาษาอังกฤษ.jpeg",
  },

  // --- Chapter 4: IT Request ---
  {
    heading: "บทที่ 4  การสร้างคำร้องไอที (IT Request)",
    purpose: "แจ้งปัญหาหรือขอรับบริการจากฝ่ายไอที",
    steps: [
      "เลือกเมนู คำร้องของฉัน (My Requests) จากแถบด้านซ้าย",
      "กดปุ่ม สร้างคำร้องใหม่",
      "เลือกประเภทคำร้อง เช่น ขอคำแนะนำ แจ้งซ่อม ขอสิทธิ์การใช้งาน ฯลฯ",
      "กรอกรายละเอียดของปัญหาในช่อง รายละเอียด",
      "ระบุเหตุผลหรือความเร่งด่วนในช่อง เหตุผล",
      "แนบไฟล์ภาพประกอบ (ถ้ามี)",
      "เลือกผู้อนุมัติ (กรณีเป็นประเภทที่ต้องผ่านการอนุมัติ)",
      "กดปุ่ม บันทึก เพื่อส่งคำร้อง",
    ],
    notes: [
      "ระบบจะจัดหมวดหมู่และระดับความเร่งด่วนให้โดยอัตโนมัติ",
      "ข้อมูลผู้ขอจะถูกดึงจากบัญชีที่เข้าสู่ระบบโดยอัตโนมัติ",
    ],
    image: "สร้าง IT Request.jpeg",
  },
  {
    heading: "4.1  ตัวอย่างการขอคำแนะนำด้านไอที",
    purpose: "ตัวอย่างการกรอกแบบฟอร์มสำหรับขอคำแนะนำ",
    steps: [
      "เลือกประเภทคำร้องเป็น ขอคำแนะนำ",
      "อธิบายประเด็นที่ต้องการคำแนะนำให้ชัดเจน",
      "กดปุ่ม บันทึก เพื่อส่งคำร้องให้ฝ่ายไอที",
    ],
    image: "ตัวอย่างการขอคำแนะนำด้านไอที.png",
  },

  // --- Chapter 5: My Requests ---
  {
    heading: "บทที่ 5  การติดตามคำร้องของฉัน",
    purpose: "ตรวจสอบสถานะและประวัติคำร้องที่เคยส่ง",
    steps: [
      "เลือกเมนู คำร้องของฉัน",
      "ดูรายการคำร้องทั้งหมดในรูปแบบตาราง",
      "ใช้ช่องค้นหาหรือเลือกตัวกรองตามเดือนเพื่อค้นหาคำร้อง",
      "ดูสถานะของคำร้องที่คอลัมน์ขวาสุดของตาราง",
    ],
    notes: [
      "สถานะคำร้อง ได้แก่ รอดำเนินการ กำลังดำเนินการ และดำเนินการเสร็จสิ้น",
      "สถานะการอนุมัติ ได้แก่ รออนุมัติ อนุมัติแล้ว และไม่อนุมัติ",
    ],
    image: "หน้ารายการแจ้งซ่อมของฉัน.jpeg",
  },
  {
    heading: "บทที่ 6  การเรียกดูรายละเอียดคำร้อง",
    purpose: "เปิดดูข้อมูลของคำร้องและดำเนินการต่อ",
    steps: [
      "กดที่ไอคอนรูปตาในแถวของคำร้องที่ต้องการดู",
      "ตรวจสอบรายละเอียดคำร้อง ผู้ขอ ผู้อนุมัติ และสถานะ",
      "กดปุ่ม ดูเอกสาร เพื่อออกเอกสารคำร้องในรูปแบบ PDF",
      "กดปุ่ม คัดลอกลิงก์อนุมัติ เพื่อส่งให้ผู้อนุมัติ",
      "กดปุ่ม ยกเลิกคำร้อง ได้ในกรณีที่คำร้องยังไม่ถูกดำเนินการ",
    ],
    image: "หน้ารายละเอียดคำร้อง สามารถส่งอนุมัติเป็นเอกสารได้.jpeg",
  },
  {
    heading: "6.1  ตัวอย่างเอกสารคำร้อง",
    purpose: "รูปแบบเอกสาร PDF ที่ระบบออกให้อัตโนมัติ",
    steps: [
      "ระบบแสดงเอกสารคำร้องพร้อมข้อมูลผู้ขอ หัวหน้าผู้อนุมัติ และรายละเอียดคำร้อง",
      "สามารถสั่งพิมพ์หรือดาวน์โหลดเป็นไฟล์ PDF ได้",
    ],
    image: "ตัวอย่างเอกสารคำร้องขอ.png",
  },
  {
    heading: "6.2  การดูไฟล์แนบของคำร้อง",
    purpose: "ตรวจสอบไฟล์ที่แนบมาในคำร้อง",
    steps: [
      "เปิดหน้ารายละเอียดคำร้อง",
      "กดที่ภาพตัวอย่างของไฟล์แนบเพื่อแสดงผลแบบเต็มขนาด",
    ],
    image: "IT Notesหากมีไฟล์แนบสามารถ Preview ได้.jpeg",
  },

  // --- Chapter 7: Approval ---
  {
    heading: "บทที่ 7  การส่งคำร้องให้ผู้อนุมัติ",
    purpose: "ส่งคำร้องให้หัวหน้าหรือผู้มีสิทธิอนุมัติผ่านลิงก์",
    steps: [
      "เปิดรายละเอียดของคำร้องที่ต้องการส่งอนุมัติ",
      "กดปุ่ม คัดลอกลิงก์อนุมัติ",
      "ส่งลิงก์ให้ผู้อนุมัติผ่านช่องทางที่สะดวก เช่น อีเมลหรือแชท",
    ],
    notes: [
      "ผู้อนุมัติต้องเข้าสู่ระบบด้วยบัญชีของตนเองก่อน จึงจะกดอนุมัติได้",
      "เฉพาะผู้อนุมัติที่ถูกระบุไว้ในคำร้องเท่านั้นที่จะเห็นปุ่มอนุมัติ",
    ],
    image: "ตัวอย่างการส่งอนุมัติ ส่งลิ้ง.jpeg",
  },
  {
    heading: "7.1  ขั้นตอนของผู้อนุมัติ",
    purpose: "ผู้อนุมัติพิจารณาคำร้องจากลิงก์ที่ได้รับ",
    steps: [
      "เปิดลิงก์อนุมัติที่ได้รับ",
      "เข้าสู่ระบบด้วยบัญชีของผู้อนุมัติ (หากยังไม่ได้เข้าสู่ระบบ)",
      "ตรวจสอบรายละเอียดของคำร้อง",
      "กดปุ่ม อนุมัติ หรือ ไม่อนุมัติ พร้อมระบุความเห็น (ถ้ามี)",
    ],
    image: "ส่งลิ้งให้ ผู้อนุมัติเพื่อ Approve (ต้อง Login ก่อนถึงจะ Approve ได้).jpeg",
  },
  {
    heading: "7.2  หน้าจอยืนยันการอนุมัติ",
    purpose: "ยืนยันว่าระบบบันทึกการอนุมัติเรียบร้อย",
    steps: [
      "เมื่อกดอนุมัติแล้ว ระบบจะแสดงหน้ายืนยันพร้อมเวลาและผู้อนุมัติ",
      "สถานะคำร้องจะเปลี่ยนเป็น อนุมัติแล้ว โดยอัตโนมัติ",
    ],
    image: "หน้าอนุมัติสำเร็จ.jpeg",
  },

  // --- Chapter 8: Borrow Equipment ---
  {
    heading: "บทที่ 8  การเบิกอุปกรณ์ไอที",
    purpose: "ขอเบิกอุปกรณ์จากสต๊อกของฝ่ายไอที",
    steps: [
      "เลือกเมนู เบิกอุปกรณ์ (Borrow Equipment) จากแถบด้านซ้าย",
      "ดูรายการคำขอเบิกของตนเองและสถานะปัจจุบัน",
      "กดปุ่ม สร้างคำขอเบิกใหม่ เพื่อเริ่มเบิกอุปกรณ์",
    ],
    image: "หน้าการเบิกอุปกรณ์.jpeg",
  },
  {
    heading: "8.1  การสร้างคำขอเบิกอุปกรณ์",
    purpose: "เลือกอุปกรณ์จากสต๊อกและยืนยันการเบิก",
    steps: [
      "กดปุ่ม สร้างคำขอเบิกใหม่",
      "ค้นหาอุปกรณ์จากช่องค้นหาทางด้านซ้ายของหน้าจอ",
      "กดปุ่ม เลือก (PICK) หน้ารายการอุปกรณ์ที่ต้องการ",
      "ปรับจำนวนและประเภทการเบิก (เช่น ของใหม่ ของเสีย อื่น ๆ) ที่แถบด้านขวา",
      "กรอกเหตุผลการเบิก และระบุ วันที่ต้องการใช้งาน",
      "เลือกผู้อนุมัติ (กรณีอุปกรณ์ต้องผ่านการอนุมัติ)",
      "กดปุ่ม ยืนยันคำขอ",
    ],
    notes: [
      "สามารถเบิกอุปกรณ์หลายรายการในคำขอเดียวกันได้",
      "ระบบจะแสดงจำนวนคงเหลือของแต่ละรายการให้ตรวจสอบก่อน",
    ],
    image: "การสร้างการเบิกอุปกรณ์ใหม่.jpeg",
  },
  {
    heading: "8.2  การขอซื้ออุปกรณ์โดยอ้างอิงสเปคเดิม",
    purpose: "ขอซื้ออุปกรณ์ชนิดเดียวกับที่เคยมีในสต๊อก",
    steps: [
      "เลือกอุปกรณ์ต้นแบบจากรายการสต๊อก",
      "ระบุจำนวนและรายละเอียดเพิ่มเติมในหมายเหตุ",
      "ส่งคำขอเพื่อให้ฝ่ายไอทีดำเนินการจัดซื้อ",
    ],
    image: "ตัวอย่างการขอซื้ออุปกรณ์สามารถอ้างอิงสเปคเดิมได้.jpeg",
  },
  {
    heading: "8.3  การขอซื้ออุปกรณ์รายการใหม่",
    purpose: "ขอซื้ออุปกรณ์ที่ไม่เคยมีในสต๊อกมาก่อน",
    steps: [
      "กรอกชื่ออุปกรณ์และรายละเอียดด้วยตนเอง",
      "ระบุจำนวนและเหตุผลความจำเป็น",
      "ส่งคำขอเพื่อรออนุมัติจากหัวหน้าและฝ่ายไอที",
    ],
    image: "ตัวอย่างการขอซื้ออุปกรณ์ใหม่สามารถขอซื้ออุปกรณ์ที่ไม่เคยมีในสต๊อกได้.jpeg",
  },

  // --- Chapter 9: Inventory ---
  {
    heading: "บทที่ 9  การตรวจสอบสต๊อกอุปกรณ์",
    purpose: "ดูรายการและจำนวนคงเหลือของอุปกรณ์ไอที",
    steps: [
      "เลือกเมนู สต๊อกอุปกรณ์ (Inventory)",
      "ใช้ช่องค้นหาหรือเลือกตัวกรองตามหมวดหมู่และสถานะ",
      "ตรวจสอบจำนวนคงเหลือและสถานะของแต่ละรายการ",
      "กดที่รายการเพื่อดูรายละเอียดและรูปของอุปกรณ์",
    ],
    notes: [
      "สีเขียวแสดงว่ามีของเพียงพอ สีเหลืองแสดงว่าใกล้หมด และสีแดงแสดงว่าของหมด",
      "สามารถกดปุ่ม เพิ่มไปยังคำขอเบิก เพื่อสร้างคำขอเบิกได้โดยตรง",
    ],
    image: "หน้าสต๊อกอุปกรณ์ไอที.jpeg",
  },

  // --- Chapter 10: Incident Reports ---
  {
    heading: "บทที่ 10  การแจ้งความผิดปกติด้านไอที",
    purpose: "รายงานเหตุผิดปกติเร่งด่วน เช่น ไวรัส หรืออินเทอร์เน็ตใช้งานไม่ได้",
    steps: [
      "เลือกเมนู แจ้งความผิดปกติ (Incident Reports)",
      "ดูรายการแจ้งเหตุทั้งหมดของตนเอง",
      "กดปุ่ม สร้างรายการแจ้งเหตุใหม่ เพื่อเริ่มต้น",
    ],
    image: "หน้าแจ้งความผิดปกติด้านไอที.jpeg",
  },
  {
    heading: "10.1  การเพิ่มรายการแจ้งเหตุ",
    purpose: "บันทึกรายละเอียดเหตุที่เกิดขึ้น",
    steps: [
      "เลือกประเภทของเหตุ เช่น ไวรัส ระบบเครือข่ายขัดข้อง",
      "ระบุสถานที่เกิดเหตุและเวลาที่เกิด",
      "อธิบายรายละเอียดของเหตุให้ชัดเจน",
      "กดปุ่ม บันทึก เพื่อส่งรายงานให้ฝ่ายไอที",
    ],
    image: "การเพิ่มการแจ้งความผิดปกติ เช่น ไวรัส เน็ตล่ม.jpeg",
  },

  // --- Chapter 11: IT Notes ---
  {
    heading: "บทที่ 11  ประกาศและข้อมูลจากฝ่ายไอที (IT Notes)",
    purpose: "อ่านประกาศ คำแนะนำ และคู่มือที่ฝ่ายไอทีเผยแพร่",
    steps: [
      "เลือกเมนู IT Notes จากแถบด้านซ้าย",
      "ใช้ช่องค้นหาเพื่อค้นหาประกาศที่ต้องการ",
      "กดที่การ์ดประกาศเพื่อเปิดดูรายละเอียด",
    ],
    image: "หน้า IT Notes ข้อมูลด้านไอที ที่ไอทีจะโพสต์ให้ User รู้.jpeg",
  },

  // --- Chapter 12: AI Chat ---
  {
    heading: "บทที่ 12  การใช้งานผู้ช่วย AI",
    purpose: "สอบถามข้อมูลและขอคำแนะนำด้านไอทีจากผู้ช่วย AI",
    steps: [
      "กดไอคอนผู้ช่วย AI ที่มุมขวาล่างของหน้าจอ",
      "พิมพ์คำถามในช่องข้อความ แล้วกดปุ่มส่ง",
      "รอผู้ช่วย AI ตอบกลับในหน้าต่างสนทนา",
    ],
    notes: [
      "สามารถสอบถามเรื่องอุปกรณ์ ขั้นตอนการแจ้งซ่อม หรือคำถามทั่วไปด้านไอทีได้",
      "กดปุ่มล้างการสนทนาเพื่อเริ่มต้นใหม่ได้ตลอดเวลา",
    ],
    image: "ChatAI.jpeg",
  },
  {
    heading: "12.1  ตัวอย่างเมื่อมีอุปกรณ์ในสต๊อก",
    purpose: "ผู้ช่วย AI ตอบข้อมูลอุปกรณ์ที่มีอยู่",
    steps: [
      "ถามชื่ออุปกรณ์ที่ต้องการ",
      "ผู้ช่วย AI จะตอบจำนวนคงเหลือและแนะนำวิธีเบิก",
    ],
    image: "ตัวอย่างการถามอุปกรณ์ไอทีกับChatAI กรณีมีอุปกรณ์.png",
  },
  {
    heading: "12.2  ตัวอย่างเมื่อไม่มีอุปกรณ์ในสต๊อก",
    purpose: "ผู้ช่วย AI แจ้งเมื่ออุปกรณ์ไม่พร้อมให้เบิก",
    steps: [
      "ถามชื่ออุปกรณ์ที่ต้องการ",
      "ผู้ช่วย AI จะแจ้งว่าไม่มีของ และแนะนำให้สร้างคำขอซื้อ",
    ],
    image: "ตัวอย่างการถามอุปกรณ์ไอทีกับChatAI กรณีไม่มีอุปกรณ์.png",
  },

  // --- Chapter 13: Sign out ---
  {
    heading: "บทที่ 13  การออกจากระบบ",
    purpose: "จบการใช้งานอย่างปลอดภัย",
    steps: [
      "กดที่ชื่อหรือไอคอนผู้ใช้ที่มุมขวาบน",
      "เลือกเมนู ออกจากระบบ (Sign Out)",
    ],
    notes: [
      "ควรออกจากระบบทุกครั้งเมื่อใช้งานเสร็จ โดยเฉพาะบนเครื่องที่ใช้ร่วมกับผู้อื่น",
    ],
    image: "Signout.jpeg",
  },
];

// --- Helpers: image dimensions (JPEG / PNG) ---
const MAX_WIDTH_EMU = 5486400; // ~6 inch usable page width

function getImageSize(buffer, ext) {
  if (ext === ".jpg" || ext === ".jpeg") {
    let i = 2;
    while (i < buffer.length) {
      if (buffer[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buffer[i + 1];
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const height = buffer.readUInt16BE(i + 5);
        const width = buffer.readUInt16BE(i + 7);
        return { width, height };
      }
      const segLen = buffer.readUInt16BE(i + 2);
      i += 2 + segLen;
    }
  }
  if (ext === ".png") {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }
  return { width: 800, height: 600 };
}

function computeEmu(pxW, pxH) {
  const EMU_PER_PX = 9525; // 96 DPI
  let wEmu = pxW * EMU_PER_PX;
  let hEmu = pxH * EMU_PER_PX;
  if (wEmu > MAX_WIDTH_EMU) {
    const scale = MAX_WIDTH_EMU / wEmu;
    wEmu = MAX_WIDTH_EMU;
    hEmu = Math.round(hEmu * scale);
  }
  return { wEmu: Math.round(wEmu), hEmu: Math.round(hEmu) };
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// --- Paragraph builders ---
function pTitle(text) {
  return (
    `<w:p><w:pPr><w:pStyle w:val="DocTitle"/><w:jc w:val="center"/></w:pPr>` +
    `<w:r><w:rPr><w:b/><w:sz w:val="56"/><w:color w:val="0F1059"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  );
}
function pSubtitle(text) {
  return (
    `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="120"/></w:pPr>` +
    `<w:r><w:rPr><w:sz w:val="28"/><w:color w:val="4B5563"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  );
}
function pCenterMeta(text) {
  return (
    `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr>` +
    `<w:r><w:rPr><w:sz w:val="22"/><w:color w:val="6B7280"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  );
}
function pHeading1(text) {
  return (
    `<w:p><w:pPr><w:pStyle w:val="HeadingOne"/><w:spacing w:before="360" w:after="120"/>` +
    `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="0F1059"/></w:pBdr></w:pPr>` +
    `<w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="0F1059"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  );
}
function pHeading2(text) {
  return (
    `<w:p><w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr>` +
    `<w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0F1059"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  );
}
function pLabel(text) {
  return (
    `<w:p><w:pPr><w:spacing w:before="120" w:after="40"/></w:pPr>` +
    `<w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="111827"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  );
}
function pText(text) {
  return (
    `<w:p><w:pPr><w:spacing w:after="60"/></w:pPr>` +
    `<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  );
}
// Numbered list item: manual numbering (e.g. "1) ข้อความ") to avoid numPr wiring
function pStep(num, text) {
  return (
    `<w:p><w:pPr><w:spacing w:after="40"/><w:ind w:left="360" w:hanging="360"/></w:pPr>` +
    `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${num})  </w:t></w:r>` +
    `<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  );
}
function pBullet(text) {
  return (
    `<w:p><w:pPr><w:spacing w:after="40"/><w:ind w:left="360" w:hanging="240"/></w:pPr>` +
    `<w:r><w:t xml:space="preserve">•  </w:t></w:r>` +
    `<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  );
}
function pImage(rId, picId, mediaName, wEmu, hEmu) {
  return (
    `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120"/></w:pPr>` +
    `<w:r><w:drawing>` +
    `<wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">` +
    `<wp:extent cx="${wEmu}" cy="${hEmu}"/>` +
    `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="${picId}" name="Picture ${picId}"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="${picId}" name="${escapeXml(mediaName)}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill>` +
    `<a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rId}"/>` +
    `<a:stretch><a:fillRect/></a:stretch>` +
    `</pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${wEmu}" cy="${hEmu}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline>` +
    `</w:drawing></w:r></w:p>`
  );
}
function pCaption(text) {
  return (
    `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="200"/></w:pPr>` +
    `<w:r><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="6B7280"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  );
}
function pPageBreak() {
  return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
}

// --- Build docx ---
async function build() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const zip = new JSZip();

  // Prepare media
  const mediaEntries = [];
  SECTIONS.forEach((sec, idx) => {
    const imgPath = path.join(MANUAL_DIR, sec.image);
    if (!fs.existsSync(imgPath)) {
      console.warn("Missing image:", sec.image);
      return;
    }
    const ext = path.extname(sec.image).toLowerCase();
    const buf = fs.readFileSync(imgPath);
    const { width, height } = getImageSize(buf, ext);
    const { wEmu, hEmu } = computeEmu(width, height);
    const mediaName = `image${idx + 1}${ext === ".png" ? ".png" : ".jpeg"}`;
    mediaEntries.push({
      section: sec,
      mediaName,
      buf,
      rId: `rId${100 + idx}`,
      picId: idx + 1,
      wEmu,
      hEmu,
    });
    zip.file(`word/media/${mediaName}`, buf);
  });

  // [Content_Types].xml
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // Relationships
  const relEntries = [
    `<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`,
  ];
  mediaEntries.forEach((m) => {
    relEntries.push(
      `<Relationship Id="${m.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.mediaName}"/>`
    );
  });
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${relEntries.join("\n")}
</Relationships>`
  );

  // Styles
  zip.file(
    "word/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Sarabun" w:hAnsi="Sarabun" w:cs="Sarabun"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="DocTitle">
    <w:name w:val="DocTitle"/>
    <w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="56"/><w:color w:val="0F1059"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="HeadingOne">
    <w:name w:val="HeadingOne"/>
    <w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="0F1059"/></w:rPr>
  </w:style>
</w:styles>`
  );

  // --- Build body ---
  const body = [];

  // Cover
  body.push(`<w:p/>`);
  body.push(`<w:p/>`);
  body.push(`<w:p/>`);
  body.push(pTitle("คู่มือการใช้งานระบบ IT System"));
  body.push(pSubtitle("สำหรับผู้ใช้งานทั่วไป"));
  body.push(`<w:p/>`);
  body.push(pCenterMeta("จัดทำโดย  ฝ่ายเทคโนโลยีสารสนเทศ"));
  body.push(pCenterMeta("ปรับปรุงล่าสุด  เมษายน 2569"));
  body.push(pPageBreak());

  // Preface
  body.push(pHeading1("คำนำ"));
  body.push(
    pText(
      "คู่มือฉบับนี้จัดทำขึ้นเพื่อใช้เป็นแนวทางในการใช้งานระบบ IT System สำหรับผู้ใช้งานทั่วไป " +
        "โดยอธิบายขั้นตอนตั้งแต่การเข้าสู่ระบบ การสร้างคำร้อง การเบิกอุปกรณ์ การแจ้งเหตุผิดปกติ " +
        "ไปจนถึงการใช้งานผู้ช่วย AI และการออกจากระบบ เพื่อให้ผู้ใช้สามารถดำเนินการได้อย่างถูกต้องและรวดเร็ว"
    )
  );
  body.push(
    pText(
      "หากพบปัญหาในการใช้งาน หรือมีข้อเสนอแนะเพิ่มเติม โปรดติดต่อฝ่ายเทคโนโลยีสารสนเทศ"
    )
  );

  // Table of contents
  body.push(pHeading1("สารบัญ"));
  SECTIONS.forEach((sec) => {
    body.push(pBullet(sec.heading));
  });
  body.push(pPageBreak());

  // Sections
  mediaEntries.forEach((m, i) => {
    const sec = m.section;

    // Use Heading1 for main chapters (contain "บทที่"), else Heading2
    if (sec.heading.startsWith("บทที่")) {
      body.push(pHeading1(sec.heading));
    } else {
      body.push(pHeading2(sec.heading));
    }

    if (sec.purpose) {
      body.push(pLabel("วัตถุประสงค์"));
      body.push(pText(sec.purpose));
    }

    if (sec.steps && sec.steps.length) {
      body.push(pLabel("ขั้นตอนการใช้งาน"));
      sec.steps.forEach((s, idx) => body.push(pStep(idx + 1, s)));
    }

    if (sec.notes && sec.notes.length) {
      body.push(pLabel("ข้อพึงทราบ"));
      sec.notes.forEach((n) => body.push(pBullet(n)));
    }

    body.push(pLabel("ภาพประกอบ"));
    body.push(pImage(m.rId, m.picId, m.mediaName, m.wEmu, m.hEmu));
    body.push(pCaption(`ภาพที่ ${i + 1}  ${sec.heading}`));
  });

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
${body.join("\n")}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
  zip.file("word/document.xml", documentXml);

  const content = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(OUT_FILE, content);
  console.log("Generated:", OUT_FILE);
  console.log("Sections:", mediaEntries.length);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
