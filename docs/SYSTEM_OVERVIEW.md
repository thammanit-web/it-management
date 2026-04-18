# IT Support System – Systems Overview

> เอกสารภาพรวมระบบ IT Support System สำหรับผู้ดูแลระบบ ผู้พัฒนา และผู้มีส่วนเกี่ยวข้อง
> เวอร์ชัน: 1.0 &nbsp;•&nbsp; ปรับปรุงล่าสุด: 2026-04-17

---

## 1. บทนำ (Introduction)

**IT Support System** คือระบบบริหารจัดการงานบริการด้านเทคโนโลยีสารสนเทศแบบครบวงจร (End-to-End IT Service Management) พัฒนาด้วย **Next.js 16 (App Router)** บน Node.js ใช้ **PostgreSQL** เป็นฐานข้อมูลหลัก และ **Prisma** เป็น ORM พร้อมรองรับการใช้งานทั้งบนเว็บและอุปกรณ์มือถือ (ผ่าน Capacitor)

ระบบถูกออกแบบสำหรับองค์กรขนาดกลางถึงใหญ่ (บริษัท NDC Industrial) เพื่อใช้บริหารจัดการ:
- คำร้องขอบริการด้าน IT (Service Requests / Tickets)
- การยืม-คืนอุปกรณ์ (Equipment Borrowing)
- ทรัพย์สิน IT และคลังอุปกรณ์ (Asset & Inventory)
- ใบสั่งซื้ออุปกรณ์ (Purchase Orders)
- รายงานเหตุการณ์ด้านความปลอดภัย (Incident Reports)
- คลังความรู้และรหัสผ่าน (Knowledge Vault & Credentials)
- แดชบอร์ดและรายงานเชิงวิเคราะห์
- ระบบแจ้งเตือน (Notifications)
- ระบบช่วยเหลือด้วย AI (AI-Powered Assistant)

---

## 2. วัตถุประสงค์ของระบบ (Objectives)

| # | วัตถุประสงค์ | ผลลัพธ์ที่คาดหวัง |
|---|---------------|-------------------|
| 1 | รวมศูนย์งาน IT Support ให้อยู่ในระบบเดียว | ลดการใช้ Email / Line / Paper |
| 2 | ติดตามสถานะคำร้องและอุปกรณ์แบบ Real-time | Transparency + SLA Tracking |
| 3 | ใช้ AI ช่วยจัดหมวดหมู่และให้คำปรึกษา | ลดภาระงาน IT Staff |
| 4 | บันทึก Audit Trail ครบถ้วน | Compliance / Security |
| 5 | Export ข้อมูลเป็น Excel / PDF ได้ | รองรับการตรวจสอบและงานเอกสาร |
| 6 | รองรับการใช้งานบนมือถือ | สะดวกสำหรับผู้ใช้ภาคสนาม |

---

## 3. สถาปัตยกรรมระบบ (System Architecture)

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐    │
│  │  Web Browser  │  │ Android/iOS   │  │ Print / PDF View  │    │
│  │  (Next.js UI) │  │  (Capacitor)  │  │ (@react-pdf)      │    │
│  └───────┬───────┘  └───────┬───────┘  └─────────┬─────────┘    │
└──────────┼──────────────────┼────────────────────┼──────────────┘
           │                  │                    │
           ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                Application Layer (Next.js 16)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │ App Router   │  │ API Routes   │  │ Middleware         │     │
│  │ (Pages/SSR)  │  │ (REST)       │  │ (Auth Guard)       │     │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘     │
│         └──────────┬──────┴─────────────────────┘                │
│                    ▼                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │   Services / Server Actions / Business Logic (lib/)        │ │
│  │   • Auth  • Audit  • Notifier  • AI Provider  • Exporter   │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────┬─────────────────────────────────────────┬──────────┘
             │                                         │
             ▼                                         ▼
┌───────────────────────────┐         ┌──────────────────────────────┐
│     Data Layer            │         │     External Services        │
│  ┌─────────────────────┐  │         │  • Ollama (Local LLM)        │
│  │ PostgreSQL (Prisma) │  │         │  • Groq API (fallback)       │
│  │                     │  │         │  • OpenRouter (fallback 2)   │
│  └─────────────────────┘  │         │  • Vercel Blob (File Upload) │
│  ┌─────────────────────┐  │         │  • MS Graph (Email Notify)   │
│  │ Vercel Blob Storage │  │         │                              │
│  └─────────────────────┘  │         └──────────────────────────────┘
└───────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router, React Server Components) | 16.2.0 |
| Runtime | React | 19.2.4 |
| Language | TypeScript | ^5 |
| Auth | NextAuth.js | 5.0.0-beta |
| Database | PostgreSQL + Prisma ORM | Prisma 7.5 |
| Styling | Tailwind CSS | v4 |
| Animation | Framer Motion | 12.38 |
| Charts | Recharts | 3.8 |
| PDF | @react-pdf/renderer | 4.3 |
| Excel | ExcelJS / xlsx | 4.4 / 0.18 |
| Mobile | Capacitor | 8.3 |
| AI | Ollama (local) / Groq / OpenRouter | — |
| Storage | Vercel Blob | 2.3 |
| Icons | Lucide React | 0.577 |

### 3.3 Directory Structure

```
it-system/
├── app/                       # Next.js App Router
│   ├── (dashboard)/          # Protected dashboard layout
│   │   ├── admin/            # Admin-only pages
│   │   └── user/             # User pages
│   ├── api/                  # REST API endpoints
│   ├── login/                # Login page
│   ├── approve/[id]/         # External approval link
│   └── print/                # Printable / PDF views
│
├── components/               # Reusable UI components
│   ├── ui/                   # Base UI primitives
│   ├── dashboard/            # Dashboard widgets
│   ├── notes/                # Knowledge vault UI
│   └── [feature]/            # Feature-specific components
│
├── lib/                      # Business logic & utilities
│   ├── actions/              # Server actions
│   ├── ai/                   # AI provider & prompts
│   ├── i18n/                 # Translation dictionaries
│   ├── pdf/                  # PDF templates
│   ├── services/             # Domain services
│   ├── validations/          # Input validation
│   ├── auth.ts               # NextAuth config
│   ├── audit.ts              # Audit logging
│   ├── notifier.ts           # Notification engine
│   └── code-generator.ts     # Auto sequential codes
│
├── prisma/
│   └── schema.prisma         # Database schema
│
├── hooks/                    # React custom hooks
├── public/                   # Static assets
├── android/                  # Capacitor Android project
└── middleware.ts             # Route-level auth guard
```

---

## 4. โมเดลข้อมูลหลัก (Data Model)

ระบบใช้ฐานข้อมูล PostgreSQL โดยมี Entity หลัก 16 เอนทิตี ดังนี้:

### 4.1 กลุ่ม User & Employee
| Model | หน้าที่ |
|-------|---------|
| **User** | บัญชีผู้ใช้งานระบบ (username / password / role) |
| **Employee** | ข้อมูลพนักงาน (รหัส, ชื่อ, แผนก, ตำแหน่ง, หัวหน้างาน) |

### 4.2 กลุ่ม Service Requests
| Model | หน้าที่ |
|-------|---------|
| **Request** | ใบคำร้องบริการ IT (Ticket) |
| **Comment** | ความคิดเห็น / การพูดคุยในใบคำร้อง (รองรับ Threaded Reply) |

### 4.3 กลุ่ม Equipment & Asset
| Model | หน้าที่ |
|-------|---------|
| **EquipmentRequest** | คำขอยืมอุปกรณ์ (รายชิ้น) |
| **EquipmentBorrowGroup** | กลุ่มคำขอยืม (หลายชิ้นในใบเดียว) |
| **EquipmentPurchaseOrder** | ใบสั่งซื้ออุปกรณ์ |
| **EquipmentEntryList** | รายการรับเข้าอุปกรณ์ |
| **EquipmentList** | รายการอุปกรณ์ในคลัง |
| **Asset** | ทรัพย์สิน IT (PC/Notebook/Printer/Screen) |
| **AssetHistory** | ประวัติการย้าย / ส่งซ่อม / คืน |

### 4.4 กลุ่ม Incident & Audit
| Model | หน้าที่ |
|-------|---------|
| **IncidentReport** | รายงานเหตุการณ์ด้านความปลอดภัย/ระบบ |
| **AuditLog** | บันทึกการใช้งานระบบ (Action, User, IP, Device) |

### 4.5 กลุ่ม Knowledge & Notification
| Model | หน้าที่ |
|-------|---------|
| **ItNote** | บันทึกความรู้ IT (Knowledge Base) |
| **ItNoteDetail** | รายละเอียดย่อย (Key-Value) |
| **UserCredential** | คลังรหัสผ่าน (Email/VPN/ERP/File Share) |
| **Notification** | การแจ้งเตือนในระบบ |

### 4.6 Enumerations สำคัญ
- **Role:** `user`, `admin`
- **RequestCategory:** `HARDWARE`, `SOFTWARE`, `NETWORK`, `GENERAL`
- **RequestPriority:** `LOW`, `MEDIUM`, `HIGH`
- **RequestStatus:** `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
- **RequestType:** `REPAIR`, `SUPPORT`, `PASSWORD_ACCOUNT`, `PURCHASE`, `INSTALLATION`, `LICENSE`, `ACCESS`, `CHANGE`, `OTHER`
- **AssetStatus:** `AVAILABLE`, `IN_USE`, `REPAIR`, `SCRAP`
- **AssetType:** `PC`, `NOTEBOOK`, `SCREEN`, `PRINTER`
- **IncidentType:** `MALWARE`, `SYSTEM_DOWN`, `HUMAN_ERROR`, `UNAUTHORIZED_ACCESS`
- **NotificationType:** `INFO`, `TICKET`, `EQUIPMENT`, `ALERT`

---

## 5. โมดูลหลักของระบบ (Core Modules)

### 5.1 Authentication & Authorization
- ใช้ **NextAuth.js v5** จัดการ Session แบบ JWT
- รหัสผ่านเก็บแบบ Hash (bcryptjs)
- **Middleware** (`middleware.ts`) ตรวจสิทธิ์ Route ระดับ URL
- Role-Based Access Control (RBAC): `admin` vs `user`
- Session แนบข้อมูล: `id`, `username`, `role`, `employeeId`, `name`

### 5.2 Service Request Management
- สร้าง Ticket พร้อม **Auto-Sequential Code** (เช่น `REQ-202404-0001`)
- **Dual Approval Workflow**: หัวหน้างาน + IT
- Lifecycle: `OPEN → IN_PROGRESS → RESOLVED → CLOSED`
- รองรับการแนบไฟล์ (Blob Storage)
- Threaded comments สำหรับพูดคุยภายในใบคำร้อง
- แจ้งเตือนผ่าน Notification + Email (MS Graph)

### 5.3 Equipment & Asset Management
- **Borrowing Flow**: สร้างใบยืมแบบ Group → อนุมัติ → IT อนุมัติ → ส่งมอบ → คืน
- **Inventory**: Track ปริมาณคงเหลือ / เบิกจ่าย
- **Asset Tracking**: Serial, Warranty, Location, ผู้ครอบครอง
- **Asset History**: บันทึกทุกการย้าย / ซ่อม / คืน
- **Purchase Orders**: PO Workflow (Buyer → Reviewer → Approver → Received)

### 5.4 Incident Report (รายงานเหตุการณ์)
- ฟอร์มรายงานเหตุการณ์ด้านความปลอดภัย / ระบบ
- รองรับการ **ลงลายเซ็นดิจิทัล** (ผู้รายงาน + ผู้รับผิดชอบซ่อมบำรุง)
- ประเภทเหตุการณ์: Malware, System Down, Human Error, Unauthorized Access
- **Generate PDF** สำหรับพิมพ์ / จัดเก็บ

### 5.5 AI Assistant (ระบบผู้ช่วย AI)
- **Multi-Provider Fallback**: Ollama (local) → Groq → OpenRouter
- **Smart Chat**: ตอบคำถามโดยใช้ Context จาก Ticket/Asset/KB ของผู้ใช้
- **Auto-Classification**: AI วิเคราะห์คำร้องและแนะนำ Category + Priority พร้อมเหตุผล (ภาษาไทย)
- **Purchase Recommendations**: แนะนำการสั่งซื้อตามประวัติ
- Endpoint: `/api/ai/chat`, `/api/ai/suggest`, `/api/ai/health`

### 5.6 Knowledge Vault (คลังความรู้)
- IT Notes แบบ Public / Private
- รองรับรายละเอียดแบบ Key-Value (เช่น Software Version, License Key)
- ใช้เป็น Context ของ AI Chat

### 5.7 Credential Vault (คลังรหัสผ่าน)
- เก็บ Account สำคัญของพนักงาน: Email, VPN, ERP, File Share
- เข้าถึงได้เฉพาะ Admin
- รองรับการจำกัดสิทธิ์ตามบทบาท

### 5.8 Notification System
- **Real-time Notification** ในระบบ
- **Email Notification** ผ่าน Microsoft Graph API
- แจ้งเตือน: อนุมัติ, สถานะ Ticket, การรับ-คืนอุปกรณ์
- ประเภท: `INFO`, `TICKET`, `EQUIPMENT`, `ALERT`

### 5.9 Dashboard & Reporting
- **Admin Dashboard**: สถิติใบคำร้อง, แนวโน้มอุปกรณ์, สัดส่วนแผนก, Resolution Rate
- **User Dashboard**: Ticket ของตน, อุปกรณ์ที่ยืม
- กราฟที่รองรับ: Pie / Bar / Line / Heatmap (Recharts)
- **Export**: Excel (ExcelJS), CSV, PDF

### 5.10 Audit Logging
- บันทึกทุก Action: Login, Create, Update, Delete, Export
- เก็บ: User, IP, User Agent, Device Type, Module
- ใช้ในการตรวจสอบย้อนหลัง (Forensic)

---

## 6. บทบาทและสิทธิ์การใช้งาน (Roles & Permissions)

| ฟีเจอร์ | Admin | User |
|----------|:-----:|:----:|
| Login / Dashboard | ✅ | ✅ |
| สร้าง Service Request | ✅ | ✅ |
| อนุมัติ Request | ✅ | ❌ |
| จัดการ Ticket (Assign/Close) | ✅ | ❌ |
| ยืมอุปกรณ์ | ✅ | ✅ |
| อนุมัติการยืม | ✅ | ❌ |
| ดู Inventory / Asset | ✅ | ✅ (read-only) |
| จัดการ Asset | ✅ | ❌ |
| Purchase Order | ✅ | ❌ |
| Credential Vault | ✅ | ❌ |
| สร้าง Incident Report | ✅ | ✅ |
| อนุมัติ Incident Report | ✅ | ❌ |
| IT Notes (Public) | ✅ | ✅ (read) |
| IT Notes (Private) | ✅ | ❌ |
| Users / Employees Mgmt | ✅ | ❌ |
| Audit Log | ✅ | ❌ |
| Import / Export | ✅ | ❌ |
| AI Chat | ✅ | ✅ |

---

## 7. Workflow สำคัญ (Key Workflows)

### 7.1 Service Request Lifecycle
```
[User สร้าง Request]
      ↓
[Status = OPEN] ───► AI วิเคราะห์ Category & Priority
      ↓
[หัวหน้างานอนุมัติ]
      ↓
[IT รับเรื่อง ─ Status = IN_PROGRESS]
      ↓
[IT ดำเนินการ / Comment / แนบไฟล์]
      ↓
[Status = RESOLVED]
      ↓
[ผู้ใช้ยืนยัน ─ Status = CLOSED]
```

### 7.2 Equipment Borrow Flow
```
[User สร้างใบยืม (Group)]
  ↓
[หัวหน้างานอนุมัติ]
  ↓
[IT อนุมัติ + จัดเตรียมอุปกรณ์]
  ↓
[ส่งมอบ ─ Asset.status = IN_USE]
  ↓
[คืน ─ Asset.status = AVAILABLE]
```

### 7.3 Incident Reporting Flow
```
[ผู้พบเหตุสร้างรายงาน]
  ↓
[ลงลายเซ็นผู้รายงาน]
  ↓
[ผู้รับผิดชอบซ่อมบำรุงดำเนินการ]
  ↓
[ลงลายเซ็นผู้รับผิดชอบ]
  ↓
[Generate PDF → จัดเก็บ]
```

---

## 8. การรักษาความปลอดภัย (Security)

| หัวข้อ | การดำเนินการ |
|--------|----------------|
| Password Storage | bcrypt hash |
| Session | JWT (NextAuth) |
| Route Protection | Middleware + role check |
| API Protection | Session check + role validation |
| Credentials Vault | Admin-only, encrypted at rest (DB) |
| Audit Log | บันทึกทุก action |
| File Upload | จำกัด type / size ผ่าน Vercel Blob |
| SQL Injection | Prisma ORM (parameterized) |

---

## 9. Integration ภายนอก (External Integrations)

| บริการ | วัตถุประสงค์ |
|--------|----------------|
| **Ollama** (Self-hosted) | AI Chat / Classification หลัก |
| **Groq API** | AI Fallback 1 |
| **OpenRouter** | AI Fallback 2 |
| **Vercel Blob** | File upload / attachment storage |
| **Microsoft Graph** | Email notification |
| **Capacitor** | Mobile app wrapper |

---

## 10. ความสามารถเพิ่มเติม (Other Capabilities)

- **Internationalization (i18n)**: รองรับภาษาไทย / อังกฤษ (Dictionary-based)
- **Export Excel/CSV/PDF** พร้อม Header แบบจัดรูปแบบ
- **Bulk Import** จาก Excel / JSON
- **Mobile-Ready** ผ่าน Capacitor (com.ndc.itsystem)
- **Responsive UI** รองรับ Desktop / Tablet / Mobile
- **Print-friendly View** สำหรับ Incident Report

---

## 11. ข้อกำหนดการใช้งานระบบ (System Requirements)

### Client (User)
| รายการ | ขั้นต่ำ |
|--------|----------|
| Browser | Chrome 120+ / Edge 120+ / Safari 17+ / Firefox 120+ |
| Resolution | 1366x768 |
| Internet | 2 Mbps+ |
| Mobile | Android 9+ / iOS 14+ |

### Server
| รายการ | ขั้นต่ำ | แนะนำ |
|--------|---------|--------|
| OS | Windows/Linux | Linux (Ubuntu 22+) |
| Node.js | 20 LTS | 22 LTS |
| RAM | 4 GB | 8 GB+ |
| PostgreSQL | 14 | 16 |

---

## 12. การ Deploy & Run

### Development
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev          # รันบน http://localhost:3003
```

### Production
```bash
npm run build
npm run start
```

### Environment Variables (.env)
```
DATABASE_URL=postgresql://...
AUTH_SECRET=...
AUTH_URL=https://...
BLOB_READ_WRITE_TOKEN=...
OLLAMA_BASE_URL=http://localhost:11434
GROQ_API_KEY=...
OPENROUTER_API_KEY=...
MS_GRAPH_CLIENT_ID=...
MS_GRAPH_CLIENT_SECRET=...
MS_GRAPH_TENANT_ID=...
```

---

## 13. สรุป (Summary)

**IT Support System** เป็นระบบ IT Service Management ครบวงจร ที่ผสานการทำงานของ Ticketing, Asset Management, Equipment Borrowing, Incident Reporting, Knowledge Base และ AI Assistant เข้าไว้ในระบบเดียว รองรับทั้งการทำงานบนเว็บและมือถือ พร้อมระบบบันทึก Audit Trail ครบถ้วน เหมาะสำหรับองค์กรที่ต้องการยกระดับการให้บริการ IT ให้มีประสิทธิภาพและโปร่งใส

---

> © NDC Industrial – IT Department | เอกสารภายใน (Internal Use Only)
