import React from 'react';
import { cn } from "@/lib/utils";

interface ITRequestFormProps {
  id: string;
  data: any; // The request data
}

export const ITRequestForm: React.FC<ITRequestFormProps> = ({ id, data }) => {
  if (!data) return null;

  const {
    employee,
    createdAt,
    type_request,
    description,
    reason,
    priority,
    approval_status,
    approval_date,
    it_approval_status,
    it_approval_date,
  } = data;

  const formatDate = (date: any) => {
    if (!date) return "..........................................";
    return new Date(date).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isTypeChecked = (type: string) => type_request?.toLowerCase().includes(type.toLowerCase());

  return (
    <div 
      id={id} 
      className="bg-white p-12 text-[#333] font-sans leading-tight w-[210mm] min-h-[297mm] mx-auto border border-zinc-200"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-4">
        <div className="flex items-center gap-4">
          <img src="/logo/NDC-LOGO-04.png" alt="NDC" className="h-14 object-contain" />
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-[#0F1059]">NDC</span>
            <span className="text-xs font-bold tracking-widest text-[#0F1059] -mt-1 uppercase">Industrial</span>
          </div>
        </div>
        <div className="border-2 border-black px-10 py-3 rounded-sm">
          <h1 className="text-lg font-black uppercase text-center">แบบฟอร์มร้องขอด้าน IT (IT Request)</h1>
        </div>
      </div>

      {/* Section: Requestor Info */}
      <div className="mb-6">
        <h2 className="text-sm font-black underline mb-4 uppercase tracking-wide">ข้อมูลผู้ร้องขอ</h2>
        <div className="grid grid-cols-2 gap-y-4 text-xs font-bold">
          <div className="flex items-baseline">
            <span className="shrink-0">วันที่ร้องขอ : </span>
            <span className="ml-2 border-b border-dotted border-black grow h-4 flex items-center">{formatDate(createdAt)}</span>
          </div>
          <div className="flex items-baseline">
            <span className="shrink-0">เลขที่ / No : </span>
            <span className="ml-2 border-b border-dotted border-black grow h-4 flex items-center">{data.id?.slice(-8).toUpperCase() || "................................"}</span>
          </div>
          <div className="flex items-baseline">
            <span className="shrink-0">รหัสพนักงาน (ID Code) : </span>
            <span className="ml-2 border-b border-dotted border-black grow h-4 flex items-center">{employee?.employee_code || "................................"}</span>
          </div>
          <div className="flex items-baseline">
            <span className="shrink-0">ชื่อ-สกุล (Name) : </span>
            <span className="ml-2 border-b border-dotted border-black grow h-4 flex items-center">{employee?.employee_name_th || "................................"}</span>
          </div>
          <div className="flex items-baseline">
            <span className="shrink-0">แผนก (Department) : </span>
            <span className="ml-2 border-b border-dotted border-black grow h-4 flex items-center">{employee?.department || "................................"}</span>
          </div>
          <div className="flex items-baseline">
            <span className="shrink-0">ตำแหน่ง (Position) : </span>
            <span className="ml-2 border-b border-dotted border-black grow h-4 flex items-center">{employee?.position || "................................"}</span>
          </div>
        </div>
      </div>

      {/* Section: Request Details Breakdown */}
      <div className="mb-6">
        <h2 className="text-sm font-black underline mb-4 uppercase tracking-wide">รายละเอียดการร้องขอ</h2>
        <div className="grid grid-cols-12 border border-black min-h-[120px]">
          <div className="col-span-2 border-r border-black flex flex-col items-center justify-center p-2 text-[10px] font-black uppercase tracking-tighter text-center bg-zinc-50/50">
            <div>ประเภทคำร้อง</div>
            <div className="mt-4 border-t border-black w-full pt-2">Request Type</div>
          </div>
          <div className="col-span-10 p-4 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-5 h-5 border border-black flex items-center justify-center shrink-0", isTypeChecked("repair") && "bg-zinc-800")}>
                  {isTypeChecked("repair") && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-[10px] font-bold">ขอซ่อมแซมแก้ไข/Request for repair</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("w-5 h-5 border border-black flex items-center justify-center shrink-0", (isTypeChecked("access") || isTypeChecked("account")) && "bg-zinc-800")}>
                  {(isTypeChecked("access") || isTypeChecked("account")) && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-[10px] font-bold">ขอสิทธิ์การใช้งานระบบ/Request a system access</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("w-5 h-5 border border-black flex items-center justify-center shrink-0", isTypeChecked("purchase") && "bg-zinc-800")}>
                  {isTypeChecked("purchase") && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-[10px] font-bold">ขอจัดซื้ออุปกรณ์ IT/Request for purchase of IT equipment</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("w-5 h-5 border border-black flex items-center justify-center shrink-0", isTypeChecked("other") && "bg-zinc-800")}>
                  {isTypeChecked("other") && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="flex items-baseline grow">
                   <span className="text-[10px] font-bold shrink-0">อื่นๆ/Other</span>
                   <span className="ml-2 border-b border-dotted border-black grow h-3"></span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 pl-4 border-l border-black/10">
              <div className="flex items-center gap-3">
                <div className={cn("w-5 h-5 border border-black flex items-center justify-center shrink-0", priority === "LOW" || priority === "MEDIUM" ? "bg-zinc-800" : "")}>
                  {(priority === "LOW" || priority === "MEDIUM") && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-[10px] font-bold">ปกติ/Normal</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("w-5 h-5 border border-black flex items-center justify-center shrink-0", priority === "HIGH" ? "bg-zinc-800" : "")}>
                  {priority === "HIGH" && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-[10px] font-bold">เร่งด่วน/Urgent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Box */}
      <div className="mb-6 border border-black p-6 min-h-[300px]">
        <div className="text-[11px] font-black uppercase text-center mb-6">รายละเอียดการร้องขอ (Request Details)</div>
        <div className="space-y-6 text-[11px] font-medium leading-loose">
          <p className="border-b border-dotted border-black pb-2">{description || ""}</p>
          <div className="border-b border-dotted border-black h-4 w-full"></div>
          <div className="border-b border-dotted border-black h-4 w-full"></div>
          <div className="border-b border-dotted border-black h-4 w-full"></div>
        </div>

        <div className="text-[11px] font-black uppercase text-center my-10">เหตุผลการร้องขอ (Request Reason)</div>
        <div className="space-y-6 text-[11px] font-medium leading-loose">
          <p className="border-b border-dotted border-black pb-2">{reason || ""}</p>
          <div className="border-b border-dotted border-black h-4 w-full"></div>
          <div className="border-b border-dotted border-black h-4 w-full"></div>
        </div>
      </div>

      {/* Approvals Grid */}
      <div className="grid grid-cols-2 gap-10 mt-10">
        {/* Dept Manager */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black underline uppercase">ผู้จัดการแผนกผู้ร้องขอพิจารณา (Department manager considers)</h3>
          <div className="flex gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className={cn("w-5 h-5 border border-black flex items-center justify-center shrink-0", approval_status === "APPROVED" && "bg-zinc-800")}>
                  {approval_status === "APPROVED" && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-[9px] font-bold">อนุมัติ (Approve)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("w-5 h-5 border border-black flex items-center justify-center shrink-0", approval_status === "REJECTED" && "bg-zinc-800")}>
                  {approval_status === "REJECTED" && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-[9px] font-bold">ไม่อนุมัติ (Reject)</span>
              </div>
            </div>
            <div className="grow border border-black flex flex-col h-32">
                <div className="bg-zinc-50 border-b border-black text-[8px] font-black text-center py-1 uppercase">ลงลายมือชื่อ / Signature</div>
                <div className="grow"></div>
                <div className="border-t border-black text-[8px] font-bold p-1">Date: {formatDate(approval_date)}</div>
            </div>
          </div>
          <div className="text-[9px] font-bold flex flex-col gap-2">
            <span>หมายเหตุเพิ่มเติม (More Comment)</span>
            <div className="border-b border-dotted border-black h-4"></div>
            <div className="border-b border-dotted border-black h-4"></div>
          </div>
        </div>

        {/* IT Department */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black underline uppercase">หน่วยงาน IT (IT Signed by IT department)</h3>
          <div className="flex gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className={cn("w-5 h-5 border border-black flex items-center justify-center shrink-0", it_approval_status === "APPROVED" && "bg-zinc-800")}>
                  {it_approval_status === "APPROVED" && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-[9px] font-bold">อนุมัติ (Approve)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("w-5 h-5 border border-black flex items-center justify-center shrink-0", it_approval_status === "REJECTED" && "bg-zinc-800")}>
                  {it_approval_status === "REJECTED" && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-[9px] font-bold">ไม่อนุมัติ (Reject)</span>
              </div>
            </div>
            <div className="grow border border-black flex flex-col h-32">
                <div className="bg-zinc-50 border-b border-black text-[8px] font-black text-center py-1 uppercase">ลงลายมือชื่อ / Signature</div>
                <div className="grow"></div>
                <div className="border-t border-black text-[8px] font-bold p-1">Date: {formatDate(it_approval_date)}</div>
            </div>
          </div>
          <div className="text-[9px] font-bold flex flex-col gap-2">
            <span>หมายเหตุเพิ่มเติม (More Comment)</span>
            <div className="border-b border-dotted border-black h-4"></div>
            <div className="border-b border-dotted border-black h-4"></div>
          </div>
        </div>
      </div>

      <div className="mt-20 flex justify-end text-[9px] font-black text-zinc-400 uppercase tracking-widest">
         FM-IT-01 : Rev.01 : 19/09/2025
      </div>
    </div>
  );
};
