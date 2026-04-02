"use client";

import  { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Package,
  ShieldAlert,
  Lock,
  Ticket,
  Info
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";

export default function ApprovalPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get("t") || "r"; // r: Ticket, e: Equipment (Solo), g: Group (Batch)
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [requestData, setRequestData] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=/approve/${id}?t=${type}`);
    }
  }, [authStatus, id, type, router]);

  useEffect(() => {
    if (session && id) {
      fetchData();
      fetchEmployee();
    }
  }, [session, id, type]);

  const fetchEmployee = async () => {
    const empId = (session?.user as any)?.employeeId;
    if (!empId) return;
    try {
      const res = await fetch(`/api/employees/${empId}`);
      const data = await res.json();
      setEmployee(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = (type === "e" || type === "g")
        ? `/api/equipment-requests/${id}`
        : `/api/requests/${id}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error("ไม่พบข้อมูลคำร้องขอ / Request not found");
      }
      const data = await res.json();
      setRequestData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (requestData && employee) {
      // Comparison: logged in user's Thai Name vs. request's Approval name
      const isApproverMatch = employee.employee_name_th === requestData.approval;
      setIsAuthorized(isApproverMatch || (session?.user as any)?.role === "admin");
    }
  }, [requestData, employee, session]);

  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    if (!isAuthorized) return;
    setIsSubmitting(true);
    try {
      const endpoint = (type === "e" || type === "g")
        ? `/api/equipment-requests/${id}`
        : `/api/requests/${id}`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approval_status: status,
          approval_comment: comment,
          approval: employee?.employee_name_th || session?.user?.name || "Dept Approver"
        })
      });

      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "เกิดข้อผิดพลาดในการดำเนินการ");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-vh-100 gap-4 bg-zinc-50 h-screen w-full fixed inset-0">
        <Loader2 className="h-10 w-10 text-[#0F1059] animate-spin" />
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">กำลังดึงข้อมูล... / Processing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-4 border-zinc-200">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#0F1059]">{error}</h2>
          <Button onClick={() => router.push('/')} variant="outline" className="w-full">
            <ChevronLeft className="h-4 w-4 mr-2" /> กลับหน้าหลัก / Home
          </Button>
        </Card>
      </div>
    );
  }

  if (requestData?.approval_status !== "PENDING") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-6">
        <Card className="max-w-md w-full p-10 text-center space-y-6 border-zinc-200 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#0F1059]">ดำเนินการเรียบร้อยแล้ว</h2>
            <p className="text-sm text-zinc-500">คำร้องนี้ได้ถูกดำเนินการพิจารณาไปแล้ว</p>
          </div>
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100 text-sm text-zinc-600">
            สถานะปัจจุบัน: <span className="font-bold text-[#0F1059]">{requestData?.approval_status}</span>
          </div>
          <Button
            onClick={() => router.push('/')}
            className="w-full h-11 bg-[#0F1059] text-white"
          >
            กลับหน้าหลัก / Back to Portal
          </Button>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-6">
        <Card className="max-w-md w-full p-10 text-center space-y-6 border-zinc-200">
          <Lock className="h-12 w-12 text-rose-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#0F1059]">ไม่มีสิทธิ์อนุมัติ</h2>
            <p className="text-sm text-zinc-500">คุณไม่มีชื่อเป็นผู้อนุมัติสำหรับรายการนี้</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/')} className="w-full">
            Home
          </Button>
        </Card>
      </div>
    );
  }

  const requester = (type === "e" || type === "g") 
                    ? requestData?.user?.employee?.employee_name_th 
                    : requestData?.employee?.employee_name_th;
                    
  const description = type === "g" 
                    ? `แบบฟอร์มเบิกอุปกรณ์ (Batch: ${requestData?.group_code})`
                    : type === "e" 
                      ? `เบิกอุปกรณ์: ${requestData?.equipmentList?.equipmentEntry?.list || requestData?.equipmentList?.equipmentEntry?.item_name}` 
                      : requestData?.description;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#0F1059] flex items-center justify-center text-white text-xs font-bold">IT</div>
            <h1 className="text-sm font-bold text-[#0F1059] uppercase tracking-wider">Approval Center</h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-100">
            <User className="h-3 w-3" />
            {employee?.employee_name_th}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-6">
        <div className="bg-[#0F1059] p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldAlert className="h-24 w-24 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">การพิจารณาอนุมัติคำขอ</h2>
          <p className="text-indigo-100 text-xs uppercase tracking-widest font-medium">Authorization Request Review</p>
        </div>

        {/* Request Details Card */}
        <Card className="p-0 border-zinc-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-zinc-50/80 border-b border-zinc-200 flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-400" />
            <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider">รายละเอียดคำร้อง / Request Details</h3>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-5">
              <div className="h-16 w-16 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 shrink-0 overflow-hidden">
                {type === "e" && requestData.equipmentList?.equipmentEntry?.purchaseOrder?.picture ? (
                  <img src={requestData.equipmentList.equipmentEntry.purchaseOrder.picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Ticket className="h-8 w-8" />
                )}
              </div>
              <div className="flex-1">
                <Badge variant="outline" className="mb-2 text-[10px] font-bold border-zinc-200 text-zinc-500">
                  REF: {requestData.id.slice(-8).toUpperCase()}
                </Badge>
                <h2 className="text-xl font-bold text-[#0F1059] leading-tight mb-2">{description}</h2>
                <div className="flex flex-wrap gap-4 text-xs font-medium text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> {requester}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> {new Date(requestData.createdAt).toLocaleDateString('th-TH')}
                  </div>
                </div>
              </div>
            </div>

            {type === "g" && (
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">รายการอุปกรณ์ที่เบิก / Items List</p>
                <div className="grid grid-cols-1 gap-2">
                  {requestData.requests?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-400">
                           {item.equipmentList?.equipmentEntry?.purchaseOrder?.picture ? (
                             <img src={item.equipmentList.equipmentEntry.purchaseOrder.picture} alt="" className="w-full h-full object-cover rounded-lg" />
                           ) : <Package className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0F1059]">{item.equipmentList?.equipmentEntry?.list || item.equipmentList?.equipmentEntry?.item_name}</p>
                          <p className="text-[10px] text-zinc-500 uppercase">{item.borrow_type} • Qty: {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-4 border-t border-zinc-100">
               <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">เหตุผลการขอ / Reason</p>
               <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 italic text-sm text-zinc-600 line-relaxed">
                 "{requestData?.reason || requestData?.problem_detail || "ไม่มีข้อมูลเพิ่มเติม"}"
               </div>
            </div>
          </div>
        </Card>

        {/* Action Card */}
        <Card className="p-6 border-zinc-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-[#0F1059]">ความคิดเห็นในการพิจารณา</h3>
          </div>

          <textarea
            className="w-full bg-white border border-zinc-200 rounded-xl p-4 text-sm min-h-[120px] focus:outline-none focus:ring-1 focus:ring-[#0F1059] transition-all"
            placeholder="ระบุความเห็นของคุณ... (ทางเลือก)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleAction("APPROVED")}
              disabled={isSubmitting}
              className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-2" /> อนุมัติ / Approve</>}
            </Button>
            <Button
              onClick={() => handleAction("REJECTED")}
              disabled={isSubmitting}
              variant="outline"
              className="h-12 rounded-xl border-zinc-200 text-rose-600 hover:bg-rose-50 hover:border-rose-100 font-bold text-xs"
            >
              <XCircle className="h-4 w-4 mr-2" /> ปฏิเสธ / Reject
            </Button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg text-zinc-500">
            <Info className="h-4 w-4 shrink-0" />
            <p className="text-[10px] font-medium leading-relaxed">
              การกดยืนยันจะส่งผลต่อสถานะของรายการและไม่สามารถแก้ไขได้ภายหลัง ระบบจะบันทึกชื่อของท่านเป็นผู้อนุมัติโดยอัตโนมัติ
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
}
