"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Ticket,
  User2,
  Building2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Save,
  Paperclip,
  MessageSquare,
  Send,
  Trash2,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { EmployeeSearchSelect } from "@/components/employee-search-select";
import { ITRequestPDF } from "@/lib/pdf/ITRequestPDF";
import { PDFViewer } from "@react-pdf/renderer";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  parentId?: string | null;
  user?: { email?: string | null; name?: string | null };
}

interface RequestDetail {
  id: string;
  request_code: string;
  description: string;
  reason?: string | null;
  category: string;
  priority: string;
  status: string;
  type_request?: string | null;
  attachment?: string | null;
  approval?: string | null;
  approval_status?: string | null;
  approval_comment?: string | null;
  approval_date?: string | null;
  it_approval?: string | null;
  it_approval_status?: string | null;
  it_approval_comment?: string | null;
  it_approval_date?: string | null;
  createdAt: string;
  updatedAt: string;
  employeeId?: string | null;
  userId?: string;
  employee?: {
    id: string;
    employee_code?: string | null;
    employee_name_th: string;
    employee_name_en?: string | null;
    department?: string | null;
    position?: string | null;
    supervisor_name?: string | null;
    work_location?: string | null;
  };
  user?: { email?: string | null; role?: string | null };
  comments?: Comment[];
}

// ── helpers ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    OPEN: "bg-blue-50 text-blue-600 border-blue-200",
    IN_PROGRESS: "bg-amber-50 text-amber-600 border-amber-200",
    RESOLVED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest", map[status || ""] || "bg-zinc-50 text-zinc-500 border-zinc-200")}>
      {status === "OPEN" && <Clock className="h-3 w-3" />}
      {status === "IN_PROGRESS" && <Loader2 className="h-3 w-3" />}
      {status === "RESOLVED" && <CheckCircle2 className="h-3 w-3" />}
      {status?.replace("_", " ") || "—"}
    </span>
  );
}

function ApprovalBadge({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-200",
    REJECTED: "bg-rose-50 text-rose-600 border-rose-200",
    PENDING: "bg-amber-50 text-amber-600 border-amber-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest", map[status || ""] || "bg-zinc-50 text-zinc-500 border-zinc-200")}>
      {status === "APPROVED" && <CheckCircle2 className="h-3 w-3" />}
      {status === "REJECTED" && <XCircle className="h-3 w-3" />}
      {status === "PENDING" && <Clock className="h-3 w-3" />}
      {status || "—"}
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  const map: Record<string, string> = {
    LOW: "bg-sky-50 text-sky-600 border-sky-200",
    MEDIUM: "bg-amber-50 text-amber-600 border-amber-200",
    HIGH: "bg-rose-50 text-rose-600 border-rose-200",
    URGENT: "bg-red-50 text-red-700 border-red-300",
  };
  return (
    <span className={cn("inline-flex rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest", map[priority || ""] || "bg-zinc-50 text-zinc-500 border-zinc-200")}>
      {priority || "—"}
    </span>
  );
}

function CategoryBadge({ category }: { category?: string | null }) {
  const map: Record<string, string> = {
    HARDWARE: "bg-orange-50 text-orange-600 border-orange-200",
    SOFTWARE: "bg-sky-50 text-sky-600 border-sky-200",
    NETWORK: "bg-teal-50 text-teal-600 border-teal-200",
    GENERAL: "bg-zinc-50 text-zinc-500 border-zinc-200",
  };
  return (
    <span className={cn("inline-flex rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest", map[category || ""] || "bg-zinc-50 text-zinc-500 border-zinc-200")}>
      {category || "—"}
    </span>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { locale } = useTranslation();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);

  const [formData, setFormData] = useState({
    type_request: "",
    type_request_other: "",
    description: "",
    reason: "",
    category: "SOFTWARE",
    priority: "MEDIUM",
    status: "OPEN",
    employeeId: "",
    approval: "",
    approval_status: "PENDING",
    approval_comment: "",
    it_approval: "",
    it_approval_status: "PENDING",
    it_approval_comment: "",
    createdAt: "",
  });

  const fetchRequest = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/requests/${id}`);
      if (!res.ok) { router.push("/admin/tickets"); return; }
      const data: RequestDetail = await res.json();
      setRequest(data);
      const isPredefined = ["SUPPORT","PASSWORD_ACCOUNT","BORROW_ACC","REPAIR","INSTALLATION","PURCHASE","LICENSE","ACCESS","CHANGE"].includes(data.type_request || "");
      setFormData({
        type_request: isPredefined ? (data.type_request || "REPAIR") : "OTHER",
        type_request_other: isPredefined ? "" : (data.type_request || ""),
        description: data.description || "",
        reason: data.reason || "",
        category: data.category || "SOFTWARE",
        priority: data.priority || "MEDIUM",
        status: data.status || "OPEN",
        employeeId: data.employeeId || "",
        approval: data.approval || "",
        approval_status: data.approval_status || "PENDING",
        approval_comment: data.approval_comment || "",
        it_approval: data.it_approval || "",
        it_approval_status: data.it_approval_status || "PENDING",
        it_approval_comment: data.it_approval_comment || "",
        createdAt: data.createdAt ? new Date(data.createdAt).toISOString().split("T")[0] : "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  const handleSave = async () => {
    if (!request) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          type_request: formData.type_request === "OTHER" ? formData.type_request_other : formData.type_request,
          it_approval: formData.it_approval_status !== "PENDING" && !formData.it_approval
            ? (session?.user?.name || "IT Admin") : formData.it_approval,
          approval: formData.approval_status !== "PENDING" && !formData.approval
            ? (session?.user?.name || "Supervisor") : formData.approval,
          createdAt: formData.createdAt || undefined,
        }),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchRequest();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/admin/tickets");
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setIsSendingComment(true);
    try {
      const res = await fetch(`/api/requests/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      if (res.ok) { setCommentText(""); fetchRequest(); }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingComment(false);
    }
  };

  // ── loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F1059]" />
      </div>
    );
  }

  if (!request) return null;

  const th = locale === "th";

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tickets"
            className="p-2 rounded-lg border border-zinc-100 text-zinc-400 hover:text-[#0F1059] hover:border-[#0F1059]/20 transition-all shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-[#0F1059] flex items-center justify-center text-white shadow-sm">
                <Ticket className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-black text-zinc-900 tracking-tight uppercase leading-none">
                  {th ? "รายละเอียดคำร้อง" : "Request Detail"}
                </h1>
                <p className="text-[10px] font-black text-[#0F1059] bg-[#0F1059]/8 px-2 py-0.5 rounded-md tracking-widest mt-0.5 inline-block">
                  {request.request_code}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPdfOpen(true)}
            className="h-10 rounded-lg border-zinc-100 hover:border-[#0F1059] hover:text-[#0F1059] text-[11px] font-black uppercase tracking-widest px-4 transition-all"
          >
            <Eye className="mr-2 h-3.5 w-3.5" /> PDF
          </Button>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="h-10 rounded-lg bg-[#0F1059] hover:bg-black text-[11px] font-black uppercase tracking-widest px-5 transition-all"
            >
              <Edit2 className="mr-2 h-3.5 w-3.5" /> {th ? "แก้ไข" : "Edit"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => { setIsEditing(false); fetchRequest(); }}
                className="h-10 rounded-lg text-[11px] font-black uppercase tracking-widest px-4"
              >
                {th ? "ยกเลิก" : "Cancel"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="h-10 rounded-lg bg-[#0F1059] hover:bg-black text-[11px] font-black uppercase tracking-widest px-5 transition-all"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="mr-2 h-3.5 w-3.5" />{th ? "บันทึก" : "Save"}</>}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(true)}
            className="h-10 rounded-lg border-rose-100 text-rose-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-[11px] font-black uppercase tracking-widest px-4 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Status bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-zinc-100 bg-white/70 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{th ? "สถานะ" : "Status"}</span>
          {isEditing ? (
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={cn(
                "rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-tight border-none outline-none cursor-pointer font-sans",
                formData.status === "RESOLVED" ? "bg-emerald-50 text-emerald-600" :
                formData.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
              )}
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          ) : <StatusBadge status={request.status} />}
        </div>
        <div className="w-px h-4 bg-zinc-100" />
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{th ? "ลำดับความสำคัญ" : "Priority"}</span>
          <PriorityBadge priority={request.priority} />
        </div>
        <div className="w-px h-4 bg-zinc-100" />
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{th ? "หมวดหมู่" : "Category"}</span>
          <CategoryBadge category={request.category} />
        </div>
        <div className="w-px h-4 bg-zinc-100 hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{th ? "ประเภท" : "Type"}</span>
          <span className="inline-flex rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-violet-600">
            {request.type_request || "—"}
          </span>
        </div>
        <div className="ml-auto text-[9px] font-bold text-zinc-300">
          {th ? "สร้าง" : "Created"} {new Date(request.createdAt).toLocaleDateString("en-GB")}
          {" · "}
          {th ? "อัพเดต" : "Updated"} {new Date(request.updatedAt).toLocaleDateString("en-GB")}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column (main) ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Request info card */}
          <Card className="rounded-xl border-zinc-100 bg-white/90 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/60 flex items-center gap-2">
              <Ticket className="h-3.5 w-3.5 text-[#0F1059]" />
              <span className="text-[10px] font-black text-[#0F1059] uppercase tracking-[0.2em]">
                {th ? "ข้อมูลคำร้อง" : "Request Information"}
              </span>
            </div>
            <div className="p-5 space-y-4">

              {isEditing && (
                <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/30 space-y-1">
                  <label className="text-[9px] font-black text-[#0F1059] uppercase tracking-widest">{th ? "วันที่ร้องขอ" : "Request Date"}</label>
                  <input
                    type="date"
                    value={formData.createdAt}
                    onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                    className="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-[#0F1059]/40 font-sans text-blue-900"
                  />
                </div>
              )}

              {/* Type */}
              <div className="space-y-1">
                <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{th ? "ประเภทคำร้อง" : "Request Type"}</p>
                {isEditing ? (
                  <div className="space-y-2">
                    <select
                      value={formData.type_request}
                      onChange={(e) => setFormData({ ...formData, type_request: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none font-sans"
                    >
                      <optgroup label={th ? "คำร้องมาตรฐาน" : "Standard Requests"}>
                        <option value="SUPPORT">Support</option>
                        <option value="PASSWORD_ACCOUNT">Password / Account</option>
                        <option value="BORROW_ACC">Borrow Account</option>
                        <option value="REPAIR">Repair</option>
                        <option value="INSTALLATION">Installation</option>
                      </optgroup>
                      <optgroup label={th ? "ต้องการอนุมัติ" : "Requires Approval"}>
                        <option value="PURCHASE">Purchase</option>
                        <option value="LICENSE">License</option>
                        <option value="ACCESS">Access</option>
                        <option value="CHANGE">Change</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option value="OTHER">Other</option>
                      </optgroup>
                    </select>
                    {formData.type_request === "OTHER" && (
                      <input
                        required
                        placeholder={th ? "ระบุประเภท..." : "Specify type..."}
                        className="w-full bg-zinc-50 border border-[#0F1059]/20 rounded-xl px-4 py-2.5 text-sm font-medium outline-none"
                        value={formData.type_request_other}
                        onChange={(e) => setFormData({ ...formData, type_request_other: e.target.value })}
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-zinc-700">{request.type_request || "—"}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{th ? "รายละเอียดปัญหา" : "Description"}</p>
                {isEditing ? (
                  <textarea
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-20 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-zinc-700 leading-relaxed">{request.description}</p>
                )}
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{th ? "เหตุผล / รายละเอียดเพิ่มเติม" : "Reason / Details"}</p>
                {isEditing ? (
                  <textarea
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-15 resize-none"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder={th ? "เหตุผลเพิ่มเติม (ถ้ามี)" : "Optional additional reason..."}
                  />
                ) : (
                  <p className="text-sm text-zinc-600 italic">{request.reason || <span className="text-zinc-300 not-italic">—</span>}</p>
                )}
              </div>

              {/* Category / Priority */}
              {isEditing && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{th ? "หมวดหมู่" : "Category"}</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none font-sans"
                    >
                      <option value="SOFTWARE">Software</option>
                      <option value="HARDWARE">Hardware</option>
                      <option value="NETWORK">Network</option>
                      <option value="GENERAL">General</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{th ? "ลำดับความสำคัญ" : "Priority"}</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none font-sans"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Attachment */}
          {request.attachment && (
            <Card className="rounded-xl border-zinc-100 bg-white/90 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/60 flex items-center gap-2">
                <Paperclip className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                  {th ? "รูปภาพแนบ" : "Attachment"}
                </span>
              </div>
              <div className="p-5">
                <a href={request.attachment} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition-opacity">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={request.attachment} alt="Attachment" className="max-h-100 w-auto rounded-xl border border-zinc-100 shadow-sm" />
                </a>
              </div>
            </Card>
          )}

          {/* Comments */}
          <Card className="rounded-xl border-zinc-100 bg-white/90 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/60 flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                {th ? "ความคิดเห็น" : "Comments"}
              </span>
              {(request.comments?.length ?? 0) > 0 && (
                <span className="ml-auto text-[9px] font-black text-zinc-300">{request.comments!.length}</span>
              )}
            </div>
            <div className="divide-y divide-zinc-50">
              {(request.comments?.length ?? 0) === 0 ? (
                <div className="px-5 py-8 text-center text-[11px] font-bold text-zinc-300 uppercase tracking-widest">
                  {th ? "ยังไม่มีความคิดเห็น" : "No comments yet"}
                </div>
              ) : request.comments!.map((c) => (
                <div key={c.id} className="px-5 py-3.5 hover:bg-zinc-50/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-full bg-[#0F1059]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User2 className="h-3.5 w-3.5 text-[#0F1059]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black text-zinc-700">{c.user?.email || "—"}</span>
                        <span className="text-[9px] text-zinc-300">{new Date(c.createdAt).toLocaleDateString("en-GB")} {new Date(c.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-[12px] text-zinc-600 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50/30">
              <div className="flex gap-3">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={th ? "เพิ่มความคิดเห็น..." : "Add a comment..."}
                  className="flex-1 bg-white border border-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none resize-none focus:border-[#0F1059]/20 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(); }
                  }}
                />
                <Button
                  onClick={handleSendComment}
                  disabled={!commentText.trim() || isSendingComment}
                  className="h-10 self-end rounded-xl bg-[#0F1059] hover:bg-black text-white px-4 transition-all"
                >
                  {isSendingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right column (sidebar) ──────────────────────────────────── */}
        <div className="space-y-5">

          {/* Requester info */}
          <Card className="rounded-xl border-zinc-100 bg-white/90 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/60 flex items-center gap-2">
              <User2 className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                {th ? "ข้อมูลผู้ร้อง" : "Requester"}
              </span>
            </div>
            <div className="p-5 space-y-3">
              {isEditing && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{th ? "พนักงาน" : "Employee"}</label>
                  <EmployeeSearchSelect
                    value={formData.employeeId}
                    valueType="id"
                    onChange={(val) => setFormData({ ...formData, employeeId: val })}
                    placeholder={th ? "ค้นหาพนักงาน" : "Search employee"}
                  />
                </div>
              )}
              {request.employee ? (
                <>
                  <div>
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{th ? "ชื่อ-สกุล" : "Full Name"}</p>
                    <p className="text-sm font-bold text-zinc-800">{request.employee.employee_name_th}</p>
                    {request.employee.employee_name_en && (
                      <p className="text-[11px] text-zinc-400">{request.employee.employee_name_en}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{th ? "รหัสพนักงาน" : "Emp. Code"}</p>
                      <p className="text-[11px] font-semibold text-zinc-600">{request.employee.employee_code || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{th ? "ตำแหน่ง" : "Position"}</p>
                      <p className="text-[11px] font-semibold text-zinc-600 truncate" title={request.employee.position || ""}>{request.employee.position || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{th ? "แผนก" : "Department"}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-300" />
                      <p className="text-[11px] font-semibold text-zinc-600">{request.employee.department || "—"}</p>
                    </div>
                  </div>
                  {request.employee.supervisor_name && (
                    <div>
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{th ? "หัวหน้างาน" : "Supervisor"}</p>
                      <p className="text-[11px] font-semibold text-zinc-600">{request.employee.supervisor_name}</p>
                    </div>
                  )}
                  {request.employee.work_location && (
                    <div>
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{th ? "สถานที่ทำงาน" : "Location"}</p>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-zinc-300" />
                        <p className="text-[11px] font-semibold text-zinc-600">{request.employee.work_location}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{th ? "อีเมล" : "Email"}</p>
                  <p className="text-[11px] font-semibold text-zinc-600">{request.user?.email || "—"}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Dept Approval */}
          <Card className="rounded-xl border-amber-100 bg-amber-50/20 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-amber-100/60 bg-amber-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">
                  {th ? "อนุมัติแผนก" : "Dept Approval"}
                </span>
              </div>
              <ApprovalBadge status={isEditing ? formData.approval_status : request.approval_status} />
            </div>
            <div className="p-5 space-y-3">
              {isEditing ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{th ? "สถานะ" : "Status"}</label>
                    <select
                      value={formData.approval_status}
                      onChange={(e) => setFormData({ ...formData, approval_status: e.target.value })}
                      className={cn(
                        "w-full border rounded-lg px-3 py-2 text-xs font-bold uppercase outline-none font-sans",
                        formData.approval_status === "APPROVED" ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                        formData.approval_status === "REJECTED" ? "bg-rose-50 border-rose-100 text-rose-700" :
                        "bg-white border-zinc-100 text-amber-600"
                      )}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{th ? "ผู้อนุมัติ" : "Approver"}</label>
                    <EmployeeSearchSelect
                      value={formData.approval || ""}
                      onChange={(val) => setFormData({ ...formData, approval: val })}
                      placeholder={th ? "ค้นหาผู้อนุมัติ" : "Search approver"}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{th ? "ความเห็น" : "Comment"}</label>
                    <textarea
                      className="w-full bg-white border border-amber-100 rounded-lg px-3 py-2 text-xs resize-none min-h-14 outline-none"
                      value={formData.approval_comment}
                      onChange={(e) => setFormData({ ...formData, approval_comment: e.target.value })}
                      placeholder={th ? "ความเห็น..." : "Comment..."}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{th ? "ผู้อนุมัติ" : "Approver"}</p>
                    <p className="text-[12px] font-semibold text-zinc-700">{request.approval || <span className="text-zinc-300 italic">—</span>}</p>
                  </div>
                  {request.approval_date && (
                    <div>
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{th ? "วันที่อนุมัติ" : "Approval Date"}</p>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3 text-zinc-300" />
                        <p className="text-[11px] font-semibold text-zinc-600">{new Date(request.approval_date).toLocaleDateString("en-GB")}</p>
                      </div>
                    </div>
                  )}
                  {request.approval_comment && (
                    <div>
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{th ? "ความเห็น" : "Comment"}</p>
                      <p className="text-[11px] text-zinc-600 italic bg-amber-50/60 rounded-lg px-3 py-2 border border-amber-100/60">{request.approval_comment}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* IT Approval */}
          <Card className="rounded-xl border-[#0F1059]/10 bg-[#0F1059]/5 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-[#0F1059]/10 bg-[#0F1059]/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0F1059]" />
                <span className="text-[10px] font-black text-[#0F1059] uppercase tracking-[0.2em]">
                  {th ? "อนุมัติ IT" : "IT Approval"}
                </span>
              </div>
              <ApprovalBadge status={isEditing ? formData.it_approval_status : request.it_approval_status} />
            </div>
            <div className="p-5 space-y-3">
              {isEditing ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{th ? "สถานะ" : "Status"}</label>
                    <select
                      value={formData.it_approval_status}
                      onChange={(e) => setFormData({ ...formData, it_approval_status: e.target.value })}
                      className={cn(
                        "w-full border rounded-lg px-3 py-2 text-xs font-bold uppercase outline-none font-sans",
                        formData.it_approval_status === "APPROVED" ? "bg-[#0F1059] border-[#0F1059] text-white" :
                        formData.it_approval_status === "REJECTED" ? "bg-rose-500 border-rose-500 text-white" :
                        "bg-white border-[#0F1059]/10 text-zinc-500"
                      )}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{th ? "ผู้อนุมัติ IT" : "IT Approver"}</label>
                    <EmployeeSearchSelect
                      value={formData.it_approval || ""}
                      onChange={(val) => setFormData({ ...formData, it_approval: val })}
                      placeholder={th ? "ค้นหาผู้อนุมัติ" : "Search approver"}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{th ? "ความเห็น IT" : "IT Comment"}</label>
                    <textarea
                      className="w-full bg-white border border-[#0F1059]/10 rounded-lg px-3 py-2 text-xs resize-none min-h-14 outline-none"
                      value={formData.it_approval_comment}
                      onChange={(e) => setFormData({ ...formData, it_approval_comment: e.target.value })}
                      placeholder={th ? "ความเห็นจาก IT..." : "IT comment..."}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{th ? "ผู้อนุมัติ IT" : "IT Approver"}</p>
                    <p className="text-[12px] font-semibold text-zinc-700">{request.it_approval || <span className="text-zinc-300 italic">—</span>}</p>
                  </div>
                  {request.it_approval_date && (
                    <div>
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{th ? "วันที่อนุมัติ" : "Approval Date"}</p>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3 text-zinc-300" />
                        <p className="text-[11px] font-semibold text-zinc-600">{new Date(request.it_approval_date).toLocaleDateString("en-GB")}</p>
                      </div>
                    </div>
                  )}
                  {request.it_approval_comment && (
                    <div>
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{th ? "ความเห็น" : "Comment"}</p>
                      <p className="text-[11px] text-zinc-600 italic bg-[#0F1059]/5 rounded-lg px-3 py-2 border border-[#0F1059]/8">{request.it_approval_comment}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Workflow timeline */}
          <Card className="rounded-xl border-zinc-100 bg-white/90 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/60 flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                {th ? "ขั้นตอน" : "Workflow"}
              </span>
            </div>
            <div className="p-5 space-y-3">
              {([
                {
                  key: "submitted",
                  label: th ? "ส่งคำร้อง" : "Submitted",
                  date: request.createdAt,
                  done: true,
                  rejected: false,
                  color: "bg-blue-500",
                },
                {
                  key: "dept",
                  label: th ? "อนุมัติแผนก" : "Dept Approval",
                  date: request.approval_date,
                  done: request.approval_status === "APPROVED",
                  rejected: request.approval_status === "REJECTED",
                  color: "bg-amber-500",
                },
                {
                  key: "it",
                  label: th ? "อนุมัติ IT" : "IT Approval",
                  date: request.it_approval_date,
                  done: request.it_approval_status === "APPROVED",
                  rejected: request.it_approval_status === "REJECTED",
                  color: "bg-[#0F1059]",
                },
                {
                  key: "resolved",
                  label: th ? "เสร็จสิ้น" : "Resolved",
                  date: request.status === "RESOLVED" ? request.updatedAt : null,
                  done: request.status === "RESOLVED",
                  rejected: false,
                  color: "bg-emerald-500",
                },
              ] as const).map((step) => (
                <div key={step.key} className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-white",
                    step.done ? step.color : step.rejected ? "bg-rose-400" : "bg-zinc-200"
                  )}>
                    {step.done ? <CheckCircle2 className="h-3 w-3" /> :
                     step.rejected ? <XCircle className="h-3 w-3" /> :
                     <div className="h-1.5 w-1.5 rounded-full bg-white opacity-60" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[11px] font-black uppercase tracking-wide", step.done ? "text-zinc-800" : step.rejected ? "text-rose-500" : "text-zinc-300")}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-[9px] text-zinc-300 mt-0.5">{new Date(step.date).toLocaleDateString("en-GB")}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── PDF Modal ──────────────────────────────────────────────────────── */}
      <Modal isOpen={isPdfOpen} onClose={() => setIsPdfOpen(false)} title="PDF Preview" size="xl">
        <div className="h-[70vh]">
          <PDFViewer width="100%" height="100%">
            <ITRequestPDF data={request} />
          </PDFViewer>
        </div>
      </Modal>

      {/* ── Delete confirm modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={th ? "ยืนยันการลบ" : "Confirm Delete"}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-700">
                {th ? "คุณแน่ใจหรือไม่ที่จะลบคำร้องนี้?" : "Are you sure you want to delete this request?"}
              </p>
              <p className="text-[11px] text-rose-500 mt-1">
                {th ? "การกระทำนี้ไม่สามารถย้อนกลับได้" : "This action cannot be undone."}
              </p>
              <p className="text-[11px] font-black text-rose-600 mt-1.5 bg-rose-100/60 px-2 py-0.5 rounded-md inline-block">{request.request_code}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[11px]">
              {th ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[11px]"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : (th ? "ลบ" : "Delete")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
