# เอกสารระบบ NDC IT System

**ระบบบริหารจัดการงาน IT และทรัพย์สินสารสนเทศ**

---

| รายการ | รายละเอียด |
|---|---|
| ชื่อระบบ | NDC IT Management System |
| เวอร์ชัน | 1.0 |
| ประเภท | Web Application (รองรับ Mobile ผ่าน Capacitor) |
| ภาษา | ไทย / อังกฤษ (Bilingual) |
| วันที่จัดทำเอกสาร | 2026-04-17 |

---

## สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [วัตถุประสงค์และประโยชน์](#2-วัตถุประสงค์และประโยชน์)
3. [สถาปัตยกรรมและเทคโนโลยี](#3-สถาปัตยกรรมและเทคโนโลยี)
4. [โครงสร้างผู้ใช้งานและสิทธิ์](#4-โครงสร้างผู้ใช้งานและสิทธิ์)
5. [ฟีเจอร์หลักของระบบ (Modules)](#5-ฟีเจอร์หลักของระบบ)
6. [Flow การทำงานแต่ละกระบวนการ](#6-flow-การทำงานแต่ละกระบวนการ)
7. [ฐานข้อมูลและโครงสร้างข้อมูล](#7-ฐานข้อมูลและโครงสร้างข้อมูล)
8. [ระบบ AI Chat Assistant](#8-ระบบ-ai-chat-assistant)
9. [การส่งออกเอกสาร (Export)](#9-การส่งออกเอกสาร)
10. [ระบบความปลอดภัย](#10-ระบบความปลอดภัย)
11. [ระบบบันทึกการใช้งาน (Audit Log)](#11-ระบบบันทึกการใช้งาน)
12. [การติดตั้งและใช้งานระบบ](#12-การติดตั้งและใช้งานระบบ)
13. [ข้อกำหนดเบื้องต้น (System Requirements)](#13-ข้อกำหนดเบื้องต้น)
14. [ภาคผนวก](#14-ภาคผนวก)

---

## 1. ภาพรวมระบบ

**NDC IT System** คือระบบบริหารจัดการงาน IT แบบครบวงจร (All-in-one IT Management Platform) ออกแบบมาเพื่อช่วยให้ฝ่าย IT ขององค์กรสามารถบริหารจัดการงานประจำวันได้อย่างเป็นระบบ ประกอบด้วย:

- รับแจ้งและจัดการปัญหา IT (IT Support Ticket)
- จัดการการยืม-คืนอุปกรณ์ IT (Equipment Borrowing)
- บริหารการสั่งซื้ออุปกรณ์ (Purchase Order)
- ติดตามทรัพย์สิน IT (Asset Management)
- จัดเก็บฐานข้อมูลบัญชีผู้ใช้งานระบบต่างๆ (Credentials Vault)
- คลังความรู้ IT (IT Knowledge Base)
- AI Chat Assistant ช่วยตอบคำถามและสร้างคำขอได้อัตโนมัติ
- ระบบรายงานและสถิติแบบ Interactive Dashboard

ระบบรองรับการใช้งานทั้งบน **Web Browser** และ **Mobile Application** (ผ่าน Capacitor สำหรับ Android) พร้อมระบบ 2 ภาษา (ไทย/อังกฤษ) และ 2 ธีม (Light/Dark Mode)

---

## 2. วัตถุประสงค์และประโยชน์

### 2.1 วัตถุประสงค์
1. **รวมศูนย์งาน IT** ให้อยู่ในระบบเดียว ลดการใช้ Email/Line/กระดาษ
2. **ติดตามงาน IT** ตั้งแต่เปิดเรื่องจนปิดเรื่อง พร้อม Audit Trail
3. **ควบคุมการอนุมัติ** ผ่านระบบ 2 ชั้น (หัวหน้างาน + ฝ่าย IT)
4. **บริหารทรัพย์สิน IT** อย่างถูกต้อง ตรวจสอบได้
5. **ลดภาระงานซ้ำซ้อน** ของฝ่าย IT ด้วย AI Assistant และ Knowledge Base

### 2.2 ประโยชน์ต่อองค์กร

| ผู้ที่ได้ประโยชน์ | ประโยชน์ที่ได้รับ |
|---|---|
| **พนักงานทั่วไป** | แจ้งปัญหา IT สะดวก, ตรวจสอบสถานะคำขอได้ตลอดเวลา, ใช้ AI Chat ถามปัญหาได้ 24 ชม. |
| **หัวหน้างาน** | อนุมัติคำขอผ่านระบบ, เห็นภาพรวมคำขอของทีม |
| **ฝ่าย IT** | บริหารงานเป็นระบบ, มีรายงานสถิติ, ติดตามทรัพย์สินครบถ้วน |
| **ผู้บริหาร** | Dashboard แสดงสถิติและแนวโน้ม, ดู KPI ฝ่าย IT ได้ Real-time |
| **องค์กร** | ลดต้นทุนกระดาษ, ข้อมูลตรวจสอบย้อนหลังได้, ISO/IT Governance |

---

## 3. สถาปัตยกรรมและเทคโนโลยี

### 3.1 Technology Stack

| ชั้น (Layer) | เทคโนโลยี | หน้าที่ |
|---|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript 5 | UI และ Server-Side Rendering |
| **Styling** | Tailwind CSS 4, Framer Motion | การออกแบบและ Animation |
| **Backend** | Next.js API Routes, Server Actions | Business Logic และ API |
| **Database** | PostgreSQL (Neon Cloud) | จัดเก็บข้อมูล |
| **ORM** | Prisma 7 | Query ข้อมูล |
| **Authentication** | NextAuth.js 5 + JWT | ระบบล็อกอิน |
| **AI Engine** | Ollama / Groq / OpenRouter (Multi-fallback) | AI Chatbot |
| **Export** | ExcelJS, @react-pdf/renderer | สร้างเอกสาร Excel/PDF |
| **File Storage** | Vercel Blob Storage | เก็บไฟล์แนบ/รูปภาพ |
| **Mobile** | Capacitor (Android) | แพ็กเป็น Mobile App |

### 3.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  (Web Browser / Mobile App - iOS/Android via Capacitor) │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Application Layer                   │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Pages (UI)   │  │ Server       │  │  API Routes  │ │
│  │  (App Router) │  │ Components   │  │              │ │
│  └───────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │  AI Provider │  │ Vercel Blob  │
│  (via Prisma)│  │ (Ollama/Groq │  │  (File Store)│
│              │  │ /OpenRouter) │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 3.3 การออกแบบระบบ
- **Monolithic Full-Stack:** ใช้ Next.js ชุดเดียวทั้ง Front-End และ Back-End
- **Server-Side Rendering (SSR):** หน้าเว็บโหลดเร็ว SEO-friendly
- **REST API:** 25+ Endpoints สำหรับเชื่อมต่อข้อมูล
- **JWT Session:** รักษาการล็อกอินผ่าน Token ที่ปลอดภัย
- **Role-Based Access Control (RBAC):** แยกสิทธิ์ User/Admin

---

## 4. โครงสร้างผู้ใช้งานและสิทธิ์

### 4.1 บทบาท (Roles)

| Role | สิทธิ์ในการใช้งาน |
|---|---|
| **User** (พนักงานทั่วไป) | แจ้งปัญหา IT, ขอยืมอุปกรณ์, ดูคำขอของตนเอง, ใช้ AI Chat, ดู Knowledge Base |
| **Admin** (เจ้าหน้าที่ IT) | ทุกสิทธิ์ของ User + อนุมัติคำขอ, จัดการทรัพย์สิน, สั่งซื้อ, จัดการ User/Employee, ดู Audit Log, นำเข้าข้อมูล Bulk |

### 4.2 เมนูการใช้งาน (Sidebar Navigation)

**เมนูสำหรับ User:**
- 🏠 Dashboard
- 📋 คำขอของฉัน (My Requests)
- 📦 เบิก/ยืมอุปกรณ์ (Borrow Equipment)
- 📊 คลังสินค้า (Inventory)
- 📚 คู่มือ IT (IT Notes)
- 🤖 AI Chat (Floating Button)

**เมนูสำหรับ Admin (เพิ่มเติม):**
- 🎫 Tickets ทั้งหมด
- ✅ การอนุมัติ (Approvals)
- 🛒 Purchase Orders
- 📥 Equipment Entry Lists
- 💻 Assets (ทรัพย์สิน)
- 👥 Employees
- 🔐 Credentials (รหัสผ่าน)
- 👤 Users (บัญชีผู้ใช้)
- 📝 IT Notes (จัดการ)
- 📤 Import Excel
- 📜 Audit Logs

---

## 5. ฟีเจอร์หลักของระบบ

### 5.1 Module: IT Support Ticket (ใบแจ้งซ่อม/ขอความช่วยเหลือ)

**วัตถุประสงค์:** ให้พนักงานแจ้งปัญหา IT ผ่านระบบ และฝ่าย IT ใช้ติดตามและแก้ไขปัญหา

**คุณสมบัติ:**
- สร้างใบแจ้งด้วย Form พร้อมรายละเอียด: ประเภทปัญหา, คำอธิบาย, เหตุผล
- **Category:** Hardware, Software, Network, General
- **Priority:** Low, Medium, High
- **Status:** Open → In Progress → Resolved → Closed
- Auto-generate รหัสใบขอ: `REQ-YYYYMM-NNNN` (เช่น REQ-202604-0001)
- ระบบอนุมัติ 2 ชั้น (หัวหน้าแผนก → ฝ่าย IT)
- Comment thread สำหรับสนทนาระหว่างผู้แจ้งและฝ่าย IT (รองรับ Nested Reply)
- Export เป็น PDF สำหรับเก็บเอกสาร
- Filter และค้นหาตาม: status, priority, category, ประเภทคำขอ
- AI ช่วยแนะนำ category ตามคำอธิบาย

### 5.2 Module: Equipment Borrowing (เบิก/ยืมอุปกรณ์)

**วัตถุประสงค์:** ให้พนักงานเบิกหรือยืมอุปกรณ์ IT เช่น เมาส์, คีย์บอร์ด, สาย HDMI เป็นต้น

**คุณสมบัติ:**
- **Batch Request:** ขอหลายรายการพร้อมกันใน 1 ใบ (Equipment Borrow Group)
- เลือกอุปกรณ์จากคลัง หรือพิมพ์เพิ่มเอง (Manual Entry)
- ระบุประเภทการเบิก: NEW (ใหม่), BROKEN (ทดแทนของเสีย), OTHER, PURCHASE (ต้องสั่งซื้อ)
- ระบุวันที่ต้องการ (date_needed)
- Auto-generate รหัส: `EBG-YYYYMM-NNNN` (Group), `ERQ-YYYYMM-NNNN` (Item)
- อนุมัติ 2 ชั้น (หัวหน้าแผนก → ฝ่าย IT)
- ตัด Stock อัตโนมัติเมื่อ IT อนุมัติ
- Export PDF เป็น "ใบเบิกอุปกรณ์" (Borrow Requisition Form)
- AI Chat สามารถสร้างใบเบิกให้อัตโนมัติได้

### 5.3 Module: Purchase Order (ใบสั่งซื้ออุปกรณ์)

**วัตถุประสงค์:** บริหารจัดการการสั่งซื้ออุปกรณ์ IT จาก Supplier

**คุณสมบัติ:**
- สร้างใบ PO ระบุ: รายการ, รายละเอียด, จำนวน, เหตุผลการสั่งซื้อ
- บันทึกผู้ซื้อ (Buyer), ผู้ตรวจสอบ (Reviewer), ผู้อนุมัติ (Approver)
- **Status:** Pending → Ordered → Received
- Auto-generate: `PO-YYYYMM-NNNN`
- แนบรูปภาพเอกสาร PO ได้
- **AI Recommendation:** ระบบ AI แนะนำรายการที่ควรสั่งซื้อ (วิเคราะห์จาก Stock ที่เหลือน้อยและแนวโน้มการเบิก)

### 5.4 Module: Equipment Entry List (รายการรับเข้าคลัง)

**วัตถุประสงค์:** บันทึกการรับของเข้าคลังเมื่อ PO มาถึง

**คุณสมบัติ:**
- ผูกกับ Purchase Order
- บันทึก: ยี่ห้อ, จำนวน, หน่วย, ผู้รับของ, วันที่รับ
- แยกประเภทรายการ: MAIN (อุปกรณ์หลัก), ACCESSORY (อุปกรณ์เสริม)
- สร้างรายการใน Inventory อัตโนมัติ

### 5.5 Module: Inventory (คลังอุปกรณ์)

**วัตถุประสงค์:** แสดงจำนวนคงเหลือของอุปกรณ์ที่รับเข้ามา

**คุณสมบัติ:**
- Auto-generate รหัส: `EQ-YYYYMM-NNNN`
- Track จำนวนเริ่มต้น (payout_amount) และคงเหลือ (remaining)
- อัพเดท remaining อัตโนมัติเมื่อมีการเบิก
- แจ้งเตือน Stock ใกล้หมด

### 5.6 Module: Asset Management (ทรัพย์สิน IT)

**วัตถุประสงค์:** บริหารทรัพย์สิน IT ที่มีมูลค่าสูง เช่น PC, Notebook, Monitor, Printer

**คุณสมบัติ:**
- Auto-generate Asset Code แยกตามประเภท:
  - `NDCPC0001` = PC
  - `NDCNB0001` = Notebook
  - `NDCSC0001` = Screen/Monitor
  - `NDCPT0001` = Printer
- ข้อมูลครบถ้วน: Serial Number, ยี่ห้อ, รุ่น, Specs, วันที่ซื้อ, ราคา, วันหมดประกัน
- **Status:** Available, In Use, Repair, Scrap
- ผูกกับพนักงานผู้ใช้งาน (Current Holder)
- **Asset History:** บันทึกการเคลื่อนย้าย เปลี่ยนผู้ถือ ซ่อม ตลอด Lifecycle
- แจ้งเตือนใกล้หมดประกัน

### 5.7 Module: User Credentials (คลังรหัสผ่าน)

**วัตถุประสงค์:** จัดเก็บ Username/Password ของพนักงานสำหรับระบบต่างๆ ในองค์กร

**คุณสมบัติ:**
- รองรับหลายประเภทบัญชี: EMAIL, FILE_SHARE, VPN, ERP, SOFTWARE, OTHER
- เข้ารหัสรหัสผ่านด้วย **AES-256-CBC**
- ดึงข้อมูลได้เฉพาะ Admin
- ผูกกับ Employee

### 5.8 Module: Employee Management

**วัตถุประสงค์:** จัดเก็บข้อมูลพนักงานที่ใช้ระบบ IT

**คุณสมบัติ:**
- รหัสพนักงาน, ชื่อไทย/อังกฤษ, เพศ, ตำแหน่ง, แผนก, สถานที่ทำงาน, หัวหน้างาน
- Status: Active / Inactive
- บันทึกวันเริ่มงาน - วันสิ้นสุด
- ผูกกับ User Account สำหรับเข้าระบบ

### 5.9 Module: IT Knowledge Base (คู่มือ IT)

**วัตถุประสงค์:** เก็บคู่มือการแก้ปัญหา IT ที่พบบ่อย เพื่อให้ User ค้นหาได้เอง

**คุณสมบัติ:**
- บันทึกแบบ Label-Value (เช่น "ปัญหา: เน็ตช้า", "วิธีแก้: รีสตาร์ทเราเตอร์")
- แบ่งระดับ: Private (เฉพาะบุคคล) / Public (ทั่วทั้งองค์กร)
- Published/Unpublished
- AI Chat ดึงข้อมูลจาก Notes มาตอบคำถาม User โดยอัตโนมัติ

### 5.10 Module: Dashboard & Analytics

**Dashboard แสดงข้อมูล:**
- สถิติ KPI (จำนวน Tickets, Pending, Resolved Rate)
- กราฟ Trend รายเดือน
- กราฟ Pie แสดงสัดส่วน Category/Priority
- ตารางกิจกรรมล่าสุด (Recent Activity)
- Stock ใกล้หมด (Low Stock Alert)
- Quick Actions สำหรับสร้างคำขอเร็ว

### 5.11 Module: Bulk Import

**วัตถุประสงค์:** นำเข้าข้อมูลจำนวนมากผ่านไฟล์ Excel

**รองรับการนำเข้า:**
- **PURCHASE_ORDER:** นำเข้าใบ PO หลายๆ ใบพร้อมกัน
- **REQUEST:** นำเข้าใบแจ้ง IT ย้อนหลัง
- **EMPLOYEE_USER:** นำเข้าพนักงานพร้อมสร้าง User Account อัตโนมัติ

---

## 6. Flow การทำงานแต่ละกระบวนการ

### 6.1 Flow: IT Support Ticket

```
┌─────────┐   สร้างใบแจ้ง   ┌──────────┐   อนุมัติ   ┌──────────┐
│  User   │ ────────────► │ Manager  │ ──────────►│  IT Team │
│         │   REQ-xxxx    │ อนุมัติ   │           │  ดำเนินการ│
└─────────┘                └──────────┘            └──────────┘
     ▲                                                   │
     │                                                   │
     │              Status: OPEN → IN_PROGRESS           │
     │                     → RESOLVED → CLOSED           │
     │                                                   │
     └───────────── ปิดงาน + Comment ────────────────────┘
```

**ขั้นตอนโดยละเอียด:**
1. User กรอกฟอร์มระบุปัญหา → กด Submit
2. ระบบสร้างรหัส `REQ-YYYYMM-NNNN` อัตโนมัติ + ส่งแจ้งเตือน Manager
3. Manager เข้าระบบดู Pending Approval → อนุมัติ/ปฏิเสธ พร้อม Comment
4. เมื่อ Manager อนุมัติ → ระบบส่งต่อไปยัง IT Team
5. IT Team รับเรื่อง → เปลี่ยน Status เป็น `IN_PROGRESS`
6. ฝ่าย IT สนทนากับ User ผ่าน Comment Section
7. เมื่อแก้ไขเสร็จ → Status = `RESOLVED`
8. User ยืนยันปัญหาได้รับการแก้ไข → Status = `CLOSED`

### 6.2 Flow: Equipment Borrowing

```
┌────────┐  สร้างใบเบิก  ┌──────────┐  อนุมัติ  ┌──────────┐  จัดเตรียม  ┌────────┐
│  User  │ ───────────► │ Manager  │ ────────►│  IT Team │ ──────────►│  User  │
│        │  หลายรายการ   │          │          │ ตัด Stock │   รับของ   │        │
└────────┘  EBG-xxxx     └──────────┘          └──────────┘            └────────┘
```

**ขั้นตอนโดยละเอียด:**
1. User เลือกอุปกรณ์จาก Stock (หรือพิมพ์เอง) → ระบุจำนวน + เหตุผล (NEW/BROKEN/OTHER)
2. ระบบจัดกลุ่มเป็น Batch → สร้าง `EBG-YYYYMM-NNNN`
3. Manager อนุมัติในระดับ Batch (ไม่ต้องอนุมัติทีละชิ้น)
4. IT Team อนุมัติ + ตัด Stock จากคลัง
5. ระบบสามารถสร้าง PDF "ใบเบิกอุปกรณ์" สำหรับให้พนักงานเซ็นรับ
6. **ทางเลือก:** User สามารถใช้ AI Chat สั่งเบิกได้ เช่น "ขอเบิกเมาส์ 1 ตัว" → AI สร้างใบเบิกให้โดยอัตโนมัติ

### 6.3 Flow: Purchase Order & Receiving

```
┌─────────┐  สร้าง PO  ┌────────┐  ทบทวน  ┌──────────┐  สั่งซื้อ  ┌─────────┐
│   IT    │ ────────►│ Reviewer│ ────────►│ Approver │ ─────────►│Supplier │
│  Admin  │  PO-xxxx  │         │          │          │           │         │
└─────────┘           └────────┘          └──────────┘           └────┬────┘
                                                                      │ ส่งของ
                                                                      ▼
                                          ┌──────────┐  รับเข้าคลัง  ┌────────┐
                                          │Inventory │◄─────────────│Entry   │
                                          │ EQ-xxxx  │              │List    │
                                          └──────────┘              └────────┘
```

**ขั้นตอนโดยละเอียด:**
1. IT Admin สร้างใบ PO → สร้างรหัส `PO-YYYYMM-NNNN`
2. Status = `PENDING` → Reviewer + Approver ตรวจสอบ
3. เมื่อสั่งซื้อสำเร็จ → Status = `ORDERED`
4. Supplier ส่งของมาถึง → IT สร้าง **Equipment Entry List** บันทึกรายการที่รับ
5. Status PO = `RECEIVED` + ระบบสร้างรายการใน **Inventory** (EQ-xxxx) อัตโนมัติ
6. Stock พร้อมให้ User เบิกได้ทันที

### 6.4 Flow: Asset Lifecycle

```
[ซื้อเข้า]        [ใช้งาน]         [ซ่อม]        [เลิกใช้]
  │                │                │                │
  ▼                ▼                ▼                ▼
AVAILABLE  ──►  IN_USE  ──►  REPAIR  ──►  IN_USE  ──►  SCRAP
                  │                                      ▲
                  └──[เปลี่ยนมือ (Transfer)]────────────┘
```

**Actions ใน Asset History:**
- `ASSIGN` - มอบหมายให้พนักงาน
- `TRANSFER` - โอนย้ายระหว่างพนักงาน
- `RETURN` - ส่งคืน
- `REPAIR` - ส่งซ่อม

---

## 7. ฐานข้อมูลและโครงสร้างข้อมูล

### 7.1 ตาราง (Tables/Models) หลัก

| Table | หน้าที่ | จำนวน Field หลัก |
|---|---|---|
| **User** | บัญชีผู้ใช้งานระบบ | 5+ |
| **Employee** | ข้อมูลพนักงาน | 12+ |
| **Request** | ใบแจ้ง IT Support | 15+ |
| **Comment** | ความคิดเห็นใน Ticket (รองรับ Nested) | 6 |
| **EquipmentRequest** | รายการอุปกรณ์ที่เบิก | 14+ |
| **EquipmentBorrowGroup** | ใบเบิกแบบกลุ่ม (Batch) | 12+ |
| **EquipmentPurchaseOrder** | ใบสั่งซื้อ | 13+ |
| **EquipmentEntryList** | รายการรับเข้าคลัง | 10+ |
| **EquipmentList** | สต็อกอุปกรณ์ | 6+ |
| **Asset** | ทรัพย์สิน IT | 15+ |
| **AssetHistory** | ประวัติการใช้งานทรัพย์สิน | 8 |
| **UserCredential** | คลังรหัสผ่านของพนักงาน | 8 |
| **ItNote** | บันทึกคู่มือ IT | 6 |
| **ItNoteDetail** | รายละเอียดในบันทึก (Label-Value) | 4 |
| **AuditLog** | บันทึกการใช้งานระบบ | 8 |

### 7.2 ความสัมพันธ์ (Relations)

```
User ──1:1── Employee
     ├──1:N── Request ──1:N── Comment
     ├──1:N── EquipmentBorrowGroup ──1:N── EquipmentRequest
     └──1:N── AuditLog

Employee ──1:N── Asset ──1:N── AssetHistory
         └──1:N── UserCredential

EquipmentPurchaseOrder ──1:N── EquipmentEntryList ──1:N── EquipmentList
                                                              │
                                                              └── (ใช้ในการเบิก)
                                                                    ▼
                                                              EquipmentRequest
```

### 7.3 รูปแบบรหัสเอกสาร (Code Format)

| ประเภท | Format | ตัวอย่าง |
|---|---|---|
| IT Ticket | `REQ-YYYYMM-NNNN` | REQ-202604-0001 |
| Equipment Item Request | `ERQ-YYYYMM-NNNN` | ERQ-202604-0001 |
| Equipment Borrow Group | `EBG-YYYYMM-NNNN` | EBG-202604-0001 |
| Purchase Order | `PO-YYYYMM-NNNN` | PO-202604-0001 |
| Inventory Item | `EQ-YYYYMM-NNNN` | EQ-202604-0001 |
| Asset (PC) | `NDCPCxxxx` | NDCPC0001 |
| Asset (Notebook) | `NDCNBxxxx` | NDCNB0001 |
| Asset (Screen) | `NDCSCxxxx` | NDCSC0001 |
| Asset (Printer) | `NDCPTxxxx` | NDCPT0001 |

---

## 8. ระบบ AI Chat Assistant

### 8.1 ความสามารถ
- ตอบคำถาม IT เป็นภาษาไทยและอังกฤษ
- ดึงข้อมูลจาก IT Knowledge Base มาตอบ
- รู้ข้อมูลของ User ที่กำลังใช้งาน เช่น คำขอที่ผ่านมา, ทรัพย์สินที่ครอบครอง, Stock คงเหลือ
- **Smart Action (Agentic Mode):** สร้างใบเบิกอุปกรณ์อัตโนมัติจากการสนทนา

### 8.2 ตัวอย่างการใช้งาน AI Chat

```
User: ขอเบิกเมาส์ไร้สาย 1 ตัว เพราะของเดิมเสีย

AI: รับทราบค่ะ กำลังสร้างใบเบิกให้นะคะ
    - รายการ: เมาส์ไร้สาย
    - จำนวน: 1
    - เหตุผล: ของเดิมเสีย (BROKEN)
    กำลังประมวลผล...

    ✅ สร้างใบเบิกเรียบร้อย
    รหัสใบเบิก: ERQ-202604-0015
    สถานะ: รอการอนุมัติจากหัวหน้า
```

### 8.3 AI Provider (Multi-Fallback)

ระบบออกแบบให้มี AI Provider สำรองหลายระดับเพื่อความเสถียร:

1. **Ollama** (Primary) - AI แบบ Local ตอบเร็วที่สุด
2. **Groq** (Fallback 1) - Cloud AI ตอบเร็ว
3. **OpenRouter** (Fallback 2) - Cloud AI สำรองสุดท้าย

ระบบเช็คสถานะ Provider ด้วย `GET /api/ai/health` และเลือกใช้ตัวที่พร้อมทำงานโดยอัตโนมัติ

---

## 9. การส่งออกเอกสาร

### 9.1 PDF Export

**ใช้เทคโนโลยี:** `@react-pdf/renderer` + ฟอนต์ไทย Bai Jamjuree

| เอกสาร | Template | ใช้เมื่อ |
|---|---|---|
| ใบแจ้ง IT Support | ITRequestPDF | พิมพ์เก็บเป็นเอกสารใบแจ้ง |
| ใบเบิกอุปกรณ์ | BorrowRequisitionPDF | ให้ User เซ็นรับเมื่อรับอุปกรณ์ |

**รูปแบบ PDF มีรายละเอียด:**
- หัวเอกสารพร้อมโลโก้
- ข้อมูลผู้ขอ, วันที่, รหัสเอกสาร
- รายละเอียดการขอ
- ช่องลายเซ็นผู้ขอ/หัวหน้า/ฝ่าย IT

### 9.2 Excel Export

**ใช้เทคโนโลยี:** `ExcelJS`

**ฟีเจอร์:**
- Export ตารางใดๆ เป็น .xlsx
- หัวตารางจัดรูปแบบสวยงาม (สีพื้นหลัง #0F1059, ตัวอักษรขาว)
- Auto-fit Column Width
- Support CSV Export (with UTF-8 BOM)

**ใช้ export:** Tickets, Equipment Requests, Assets, Inventory, Audit Logs ฯลฯ

---

## 10. ระบบความปลอดภัย

### 10.1 Authentication
- ใช้ **NextAuth.js 5** มาตรฐานอุตสาหกรรม
- รหัสผ่านเข้ารหัสด้วย **bcryptjs** (10 rounds)
- Session ใช้ **JWT** เข้ารหัสด้วย `AUTH_SECRET`
- Session ประกอบด้วย: id, username, role, employeeId

### 10.2 Authorization
- **Role-Based Access Control (RBAC):** user / admin
- **Middleware:** ตรวจสิทธิ์ทุก Request ที่เข้า Protected Routes
- **API Guard:** ทุก Admin API เช็ค `role === "admin"` ก่อนทำงาน
- **Row-Level Security:** User เห็นเฉพาะคำขอของตนเอง

### 10.3 Data Protection
- **Password Hashing:** bcryptjs สำหรับ User Password
- **Credential Encryption:** AES-256-CBC สำหรับรหัสผ่านระบบอื่นๆ ที่เก็บใน Vault
- **SQL Injection Protection:** Prisma ORM ป้องกันโดย Parameterized Queries
- **CSRF Protection:** NextAuth CSRF Token
- **Input Validation:** Zod Schema ตรวจสอบทุก Input

### 10.4 Transport Security
- รองรับ HTTPS (Production)
- SameSite Cookie Policy
- Secure Cookie Flag

---

## 11. ระบบบันทึกการใช้งาน

### 11.1 Audit Log

**บันทึกทุก Action ที่สำคัญพร้อมข้อมูล:**

| Field | ข้อมูลที่จัดเก็บ |
|---|---|
| userId / userName | ผู้กระทำ |
| action | การกระทำ (CREATE, UPDATE, DELETE, LOGIN_SUCCESS, LOGIN_FAILURE, APPROVE, REJECT, EXPORT, IMPORT ฯลฯ) |
| module | โมดูลที่เกี่ยวข้อง (AUTH, TICKETS, EQUIPMENT, ASSETS, PURCHASE_ORDER ฯลฯ) |
| details | รายละเอียด (JSON) |
| ipAddress | IP ผู้ใช้ |
| userAgent | Browser Info |
| device | อุปกรณ์ (iPhone, Windows PC, Android ฯลฯ) |
| createdAt | วัน-เวลาที่กระทำ |

### 11.2 ตัวอย่างเหตุการณ์ที่บันทึก
- ✅ เข้าสู่ระบบสำเร็จ / ล้มเหลว
- ✅ สร้าง/แก้ไข/ลบ คำขอ IT
- ✅ อนุมัติ/ปฏิเสธ คำขอ
- ✅ สร้าง/แก้ไข ทรัพย์สิน
- ✅ นำเข้าไฟล์ Excel
- ✅ ส่งออกรายงาน PDF/Excel

Admin สามารถเข้าดู Audit Log ที่ `/admin/logs` และค้นหา Filter ตามเงื่อนไขต่างๆ

---

## 12. การติดตั้งและใช้งานระบบ

### 12.1 การเข้าใช้งานครั้งแรก
1. เปิด URL ของระบบ (เช่น `https://yourdomain.com`)
2. หน้า Login → กรอก Username และ Password ที่ Admin ตั้งให้
3. ระบบพาไปหน้า Dashboard
4. (แนะนำ) เปลี่ยนรหัสผ่านในครั้งแรกที่ใช้

### 12.2 การใช้งานบน Mobile
1. Admin Build ไฟล์ Android APK จากโปรเจคผ่าน Capacitor
2. ติดตั้ง APK บนอุปกรณ์
3. Login ด้วย Account เดียวกับ Web

### 12.3 การเปลี่ยนภาษา / ธีม
- ปุ่ม 🌐 มุมบนขวา → สลับ ไทย/English
- ปุ่ม ☀️/🌙 → สลับ Light/Dark Mode
- ระบบจำการตั้งค่าไว้ใน Browser

---

## 13. ข้อกำหนดเบื้องต้น

### 13.1 สำหรับผู้ใช้งาน (End-User)
- **Web Browser:** Chrome, Edge, Safari, Firefox (เวอร์ชันใหม่)
- **Mobile:** Android 8+ / iOS 13+ (สำหรับ Mobile App)
- **Internet:** Broadband หรือ 4G ขึ้นไป
- **หน้าจอ:** รองรับตั้งแต่ 320px (มือถือ) - 4K (Desktop)

### 13.2 สำหรับ Server (ติดตั้งเอง On-Premise)
- **OS:** Linux (Ubuntu 20+) / Windows Server 2019+
- **Node.js:** v20.x ขึ้นไป
- **Database:** PostgreSQL 14+ (หรือใช้ Neon Cloud)
- **RAM:** 4GB+ (แนะนำ 8GB)
- **Storage:** 20GB+ (ขึ้นกับข้อมูลและไฟล์แนบ)
- **SSL Certificate:** HTTPS สำหรับ Production

### 13.3 External Services ที่ใช้
- **Neon** - PostgreSQL Cloud Database (หรือ PostgreSQL Self-Hosted)
- **Vercel Blob** - File Storage (หรือใช้ S3 / Local Storage)
- **AI Provider:** Ollama (Local) / Groq / OpenRouter

---

## 14. ภาคผนวก

### 14.1 โครงสร้างโฟลเดอร์โปรเจค

```
it-system/
├── app/                      # Next.js App Router
│   ├── (dashboard)/          # Routes ที่ต้อง Login
│   │   ├── admin/            # หน้าสำหรับ Admin
│   │   └── user/             # หน้าสำหรับ User
│   ├── login/                # หน้า Login
│   ├── approve/              # หน้าอนุมัติผ่านลิงก์
│   └── api/                  # REST API Endpoints
├── components/               # React Components
│   ├── ai/                   # AI Chat Components
│   ├── assets/               # Asset Management UI
│   ├── credentials/          # Credential Vault UI
│   ├── dashboard/            # Dashboard Widgets
│   ├── notes/                # Knowledge Base UI
│   └── ui/                   # Base UI Components
├── lib/                      # Business Logic & Utilities
│   ├── ai/                   # AI Provider Integration
│   ├── actions/              # Server Actions
│   ├── pdf/                  # PDF Templates
│   ├── services/             # Data Services
│   ├── i18n/                 # Translation
│   ├── auth.ts               # NextAuth Setup
│   ├── prisma.ts             # Database Client
│   ├── audit.ts              # Audit Logger
│   ├── crypto.ts             # Encryption
│   └── export-utils.ts       # Excel Export
├── hooks/                    # Custom React Hooks
├── prisma/
│   └── schema.prisma         # Database Schema
├── android/                  # Capacitor Android Project
├── public/                   # Static Assets
└── docs/                     # เอกสารประกอบ
```

### 14.2 API Endpoints สรุป (25 Endpoints)

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | POST/GET | Login / Logout / Callback |
| `/api/requests` | GET/POST | จัดการ IT Tickets |
| `/api/requests/[id]` | GET/PUT | รายละเอียด Ticket |
| `/api/requests/[id]/comments` | POST | เพิ่ม Comment |
| `/api/equipment-requests` | GET/POST | จัดการ Equipment Borrow |
| `/api/equipment-requests/[id]` | GET/PUT | รายละเอียดใบเบิก |
| `/api/equipment-entry-lists` | GET/POST | รายการรับเข้าคลัง |
| `/api/equipment-lists` | GET/POST | Inventory |
| `/api/equipment-purchase-orders` | GET/POST | Purchase Orders |
| `/api/equipment-purchase-orders/recommendations` | GET | AI แนะนำ PO |
| `/api/users` | GET/POST | จัดการ User |
| `/api/users/[id]` | GET/PUT | รายละเอียด User |
| `/api/employees` | GET/POST | จัดการ Employee |
| `/api/employees/[id]` | GET | รายละเอียด Employee |
| `/api/comments/[id]` | PUT/DELETE | แก้ไข/ลบ Comment |
| `/api/audit-logs` | GET | Audit Logs |
| `/api/admin/import` | POST | นำเข้าไฟล์ Excel |
| `/api/upload` | POST | อัปโหลดไฟล์ |
| `/api/ai/chat` | POST | AI Chat |
| `/api/ai/health` | GET | ตรวจสอบ AI Provider |
| `/api/ai/suggest` | POST | AI ช่วยแนะนำ |

### 14.3 สถานะ (Status) ที่ใช้ในระบบ

**Request (IT Ticket):**
- `OPEN` - รอดำเนินการ
- `IN_PROGRESS` - กำลังดำเนินการ
- `RESOLVED` - แก้ไขเรียบร้อย
- `CLOSED` - ปิดงาน

**Approval Status:**
- `PENDING` - รออนุมัติ
- `APPROVED` - อนุมัติแล้ว
- `REJECTED` - ปฏิเสธ

**Purchase Order:**
- `PENDING` - รอสั่งซื้อ
- `ORDERED` - สั่งซื้อแล้ว
- `RECEIVED` - รับของแล้ว

**Asset:**
- `AVAILABLE` - พร้อมใช้งาน
- `IN_USE` - ใช้งานอยู่
- `REPAIR` - ส่งซ่อม
- `SCRAP` - ตัดจำหน่าย

### 14.4 การสนับสนุนหลังส่งมอบ (Support)

- **Documentation:** เอกสาร User Manual + Admin Manual (เพิ่มเติม)
- **Training:** อบรมผู้ใช้งาน (ตามข้อตกลง)
- **Maintenance:** แก้ไข Bug, ปรับปรุง Feature (ตาม SLA)
- **Backup:** แนะนำ Daily Backup Database

---

## การติดต่อ

สำหรับข้อซักถามเพิ่มเติมเกี่ยวกับระบบ กรุณาติดต่อทีมพัฒนา

---

*เอกสารฉบับนี้จัดทำขึ้นเพื่อใช้สำหรับการส่งมอบระบบและอ้างอิงการใช้งาน*
*© NDC IT System Documentation - 2026*
